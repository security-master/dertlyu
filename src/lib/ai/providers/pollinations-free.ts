import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProvider,
} from "@/types/generation";

const FREE_BASE_URL = "https://image.pollinations.ai";

export class PollinationsFreeProvider implements ImageProvider {
  readonly name = "pollinations-free";

  private env = getEnv();

  isAvailable(): boolean {
    return true;
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const model = this.resolveModel(options.model);

    const params = new URLSearchParams({
      width: String(options.width),
      height: String(options.height),
      model,
      nologo: "true",
    });

    if (options.seed !== undefined) {
      params.set("seed", String(options.seed));
    }

    if (options.negativePrompt) {
      params.set("negative", options.negativePrompt);
    }

    const encodedPrompt = encodeURIComponent(options.prompt);
    const url = `${FREE_BASE_URL}/prompt/${encodedPrompt}?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.env.POLLINATIONS_TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "image/*" },
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new AppError("PROVIDER_QUOTA_EXCEEDED");
      }

      if (response.status >= 500) {
        throw new AppError("PROVIDER_UNAVAILABLE");
      }

      if (!response.ok) {
        logger.warn("Pollinations free non-ok response", {
          provider: this.name,
          status: String(response.status),
          model,
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

      return {
        imageData,
        contentType,
        provider: this.name,
        model,
        metadata: {
          width: options.width,
          height: options.height,
          free: true,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("PROVIDER_TIMEOUT");
      }

      logger.error("Pollinations free provider error", {
        provider: this.name,
        errorCategory: "provider_error",
        message: error instanceof Error ? error.message : "unknown",
      });

      throw new AppError("PROVIDER_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveModel(model?: string): string {
    const allowed = ["turbo", "flux", "ghibli", "dreamshaper", "kontext", "nanobanana"];
    if (model && allowed.includes(model)) {
      return model;
    }
    return "turbo";
  }
}
