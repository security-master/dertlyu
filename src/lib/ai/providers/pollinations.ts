import { getEnv } from "@/lib/config/env";
import { isPollinationsConfigured } from "@/lib/config/providers";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProvider,
} from "@/types/generation";

interface PollinationsImageResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
}

export class PollinationsProvider implements ImageProvider {
  readonly name = "pollinations";

  private env = getEnv();

  isAvailable(): boolean {
    return isPollinationsConfigured();
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    if (!this.env.POLLINATIONS_API_KEY) {
      throw new AppError(
        "PROVIDER_NOT_CONFIGURED",
        "Pollinations API anahtarı yapılandırılmamış. Sunucuda POLLINATIONS_API_KEY ayarlayın."
      );
    }

    const model =
      options.model && options.model !== "auto"
        ? options.model
        : this.env.POLLINATIONS_MODEL;

    const size = `${options.width}x${options.height}`;
    const baseUrl = this.env.POLLINATIONS_BASE_URL.replace(/\/$/, "");

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.POLLINATIONS_TIMEOUT_MS
    );

    try {
      const postResult = await this.generateViaPost(
        baseUrl,
        options,
        model,
        size,
        controller.signal
      );
      if (postResult) return postResult;

      return await this.generateViaGet(
        baseUrl,
        options,
        model,
        controller.signal
      );
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("PROVIDER_TIMEOUT");
      }

      logger.error("Pollinations provider error", {
        provider: this.name,
        errorCategory: "provider_error",
        message: error instanceof Error ? error.message : "unknown",
      });

      throw new AppError("PROVIDER_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.env.POLLINATIONS_API_KEY}`,
      Accept: "application/json, image/*",
    };
  }

  private async generateViaPost(
    baseUrl: string,
    options: ImageGenerationOptions,
    model: string,
    size: string,
    signal: AbortSignal
  ): Promise<ImageGenerationResult | null> {
    const body: Record<string, unknown> = {
      prompt: options.prompt,
      model,
      size,
      response_format: "b64_json",
      n: 1,
    };

    if (options.negativePrompt) {
      body.negative_prompt = options.negativePrompt;
    }

    if (options.seed !== undefined) {
      body.seed = options.seed;
    }

    const response = await fetch(`${baseUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new AppError(
        "PROVIDER_NOT_CONFIGURED",
        "Pollinations API anahtarı geçersiz. POLLINATIONS_API_KEY değerini kontrol edin."
      );
    }

    if (response.status === 429) {
      throw new AppError("PROVIDER_QUOTA_EXCEEDED");
    }

    if (response.status >= 500) {
      throw new AppError("PROVIDER_UNAVAILABLE");
    }

    if (!response.ok) {
      logger.warn("Pollinations POST failed", {
        provider: this.name,
        status: String(response.status),
      });
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.startsWith("image/")) {
      const imageData = Buffer.from(await response.arrayBuffer());
      return this.buildResult(imageData, contentType, model, options);
    }

    const json = (await response.json()) as PollinationsImageResponse;

    if (json.error) {
      logger.warn("Pollinations API error", {
        provider: this.name,
        errorCategory: json.error.code ?? "api_error",
      });
      throw new AppError("GENERATION_FAILED");
    }

    const b64 = json.data?.[0]?.b64_json;
    if (b64) {
      const imageData = Buffer.from(b64, "base64");
      return this.buildResult(imageData, "image/png", model, options);
    }

    const imageUrl = json.data?.[0]?.url;
    if (imageUrl) {
      const imageResponse = await fetch(imageUrl, {
        headers: this.authHeaders(),
        signal,
      });

      if (!imageResponse.ok) {
        throw new AppError("GENERATION_FAILED");
      }

      const resolvedType =
        imageResponse.headers.get("content-type") ?? "image/jpeg";
      const imageData = Buffer.from(await imageResponse.arrayBuffer());
      return this.buildResult(imageData, resolvedType, model, options);
    }

    return null;
  }

  private async generateViaGet(
    baseUrl: string,
    options: ImageGenerationOptions,
    model: string,
    signal: AbortSignal
  ): Promise<ImageGenerationResult> {
    const params = new URLSearchParams({
      model,
      width: String(options.width),
      height: String(options.height),
      key: this.env.POLLINATIONS_API_KEY!,
    });

    if (options.seed !== undefined) {
      params.set("seed", String(options.seed));
    }

    if (options.negativePrompt) {
      params.set("negative", options.negativePrompt);
    }

    const encodedPrompt = encodeURIComponent(options.prompt);
    const url = `${baseUrl}/image/${encodedPrompt}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...this.authHeaders(),
        Accept: "image/*",
      },
      signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new AppError(
        "PROVIDER_NOT_CONFIGURED",
        "Pollinations API anahtarı geçersiz. POLLINATIONS_API_KEY değerini kontrol edin."
      );
    }

    if (response.status === 429) {
      throw new AppError("PROVIDER_QUOTA_EXCEEDED");
    }

    if (response.status >= 500) {
      throw new AppError("PROVIDER_UNAVAILABLE");
    }

    if (!response.ok) {
      logger.warn("Pollinations GET failed", {
        provider: this.name,
        status: String(response.status),
      });
      throw new AppError("GENERATION_FAILED");
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    if (!contentType.startsWith("image/")) {
      throw new AppError("GENERATION_FAILED");
    }

    const imageData = Buffer.from(await response.arrayBuffer());

    if (imageData.length === 0) {
      throw new AppError("GENERATION_FAILED");
    }

    return this.buildResult(imageData, contentType, model, options);
  }

  private buildResult(
    imageData: Buffer,
    contentType: string,
    model: string,
    options: ImageGenerationOptions
  ): ImageGenerationResult {
    if (imageData.length === 0) {
      throw new AppError("GENERATION_FAILED");
    }

    return {
      imageData,
      contentType,
      provider: this.name,
      model,
      metadata: {
        width: options.width,
        height: options.height,
      },
    };
  }
}
