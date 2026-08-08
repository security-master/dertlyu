import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProvider,
} from "@/types/generation";

const PROVIDER_ERROR_MAP: Record<string, AppError["code"]> = {
  timeout: "PROVIDER_TIMEOUT",
  rate_limit: "PROVIDER_QUOTA_EXCEEDED",
  quota: "PROVIDER_QUOTA_EXCEEDED",
  unavailable: "PROVIDER_UNAVAILABLE",
};

export class PollinationsProvider implements ImageProvider {
  readonly name = "pollinations";

  private env = getEnv();

  isAvailable(): boolean {
    return true;
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const model = options.model && options.model !== "auto"
      ? options.model
      : this.env.POLLINATIONS_MODEL;

    const params = new URLSearchParams({
      model,
      width: String(options.width),
      height: String(options.height),
    });

    if (options.seed !== undefined) {
      params.set("seed", String(options.seed));
    }

    if (options.negativePrompt) {
      params.set("negative", options.negativePrompt);
    }

    const encodedPrompt = encodeURIComponent(options.prompt);
    const url = `${this.env.POLLINATIONS_BASE_URL}/image/${encodedPrompt}?${params.toString()}`;

    const headers: Record<string, string> = {
      Accept: "image/*",
    };

    if (this.env.POLLINATIONS_API_KEY) {
      headers.Authorization = `Bearer ${this.env.POLLINATIONS_API_KEY}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.POLLINATIONS_TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        logger.warn("Pollinations authentication failed", {
          provider: this.name,
          status: String(response.status),
        });
        throw new AppError(
          "PROVIDER_UNAVAILABLE",
          "Image provider is not properly configured."
        );
      }

      if (response.status === 429) {
        throw new AppError("PROVIDER_QUOTA_EXCEEDED");
      }

      if (response.status >= 500) {
        throw new AppError("PROVIDER_UNAVAILABLE");
      }

      if (!response.ok) {
        logger.warn("Pollinations non-ok response", {
          provider: this.name,
          status: String(response.status),
        });
        throw new AppError("GENERATION_FAILED");
      }

      const contentType = response.headers.get("content-type") ?? "image/jpeg";

      if (!contentType.startsWith("image/")) {
        logger.warn("Pollinations returned non-image content", {
          provider: this.name,
          contentType,
        });
        throw new AppError("GENERATION_FAILED");
      }

      const arrayBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(arrayBuffer);

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
}

export function mapProviderError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const message = error instanceof Error ? error.message.toLowerCase() : "";

  for (const [keyword, code] of Object.entries(PROVIDER_ERROR_MAP)) {
    if (message.includes(keyword)) {
      return new AppError(code);
    }
  }

  return new AppError("GENERATION_FAILED");
}
