import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProvider,
} from "@/types/generation";

export class HuggingFaceProvider implements ImageProvider {
  readonly name = "huggingface";

  private env = getEnv();

  isAvailable(): boolean {
    return Boolean(this.env.HF_TOKEN);
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    if (!this.env.HF_TOKEN) {
      throw new AppError("PROVIDER_UNAVAILABLE", "Hugging Face is not configured.");
    }

    const model =
      options.model && options.model !== "auto"
        ? options.model
        : this.env.HF_IMAGE_MODEL;

    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const payload: Record<string, unknown> = {
      inputs: options.prompt,
      parameters: {
        width: options.width,
        height: options.height,
      },
    };

    if (options.negativePrompt) {
      (payload.parameters as Record<string, unknown>).negative_prompt =
        options.negativePrompt;
    }

    if (options.seed !== undefined) {
      (payload.parameters as Record<string, unknown>).seed = options.seed;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.HF_TIMEOUT_MS
    );

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "image/*",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new AppError("PROVIDER_QUOTA_EXCEEDED");
      }

      if (response.status === 503) {
        throw new AppError("PROVIDER_UNAVAILABLE", "Model is loading. Please try again.");
      }

      if (response.status >= 500) {
        throw new AppError("PROVIDER_UNAVAILABLE");
      }

      if (!response.ok) {
        logger.warn("Hugging Face non-ok response", {
          provider: this.name,
          status: String(response.status),
        });
        throw new AppError("GENERATION_FAILED");
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json.error) {
          logger.warn("Hugging Face API error", {
            provider: this.name,
            errorCategory: "api_error",
          });
          throw new AppError("GENERATION_FAILED");
        }
      }

      const resolvedContentType = contentType.startsWith("image/")
        ? contentType
        : "image/png";

      const arrayBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(arrayBuffer);

      if (imageData.length === 0) {
        throw new AppError("GENERATION_FAILED");
      }

      return {
        imageData,
        contentType: resolvedContentType,
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

      logger.error("Hugging Face provider error", {
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
