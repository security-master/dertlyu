import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { getEnv } from "@/lib/config/env";
import type { ImageProvider } from "../provider";
import type { ImageGenerationOptions, ImageGenerationResult } from "../types";
import { applyStyleToPrompt } from "../types";

export class HuggingFaceProvider implements ImageProvider {
  readonly name = "huggingface";

  isAvailable(): boolean {
    return Boolean(getEnv().huggingface.token);
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const env = getEnv().huggingface;
    if (!env.token) {
      throw new AppError("PROVIDER_UNAVAILABLE", {
        details: { provider: this.name, reason: "missing_token" },
      });
    }

    const model =
      options.model && options.model !== "auto" ? options.model : env.model;
    const prompt = applyStyleToPrompt(options.prompt, options.style);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;

    try {
      const parameters: Record<string, unknown> = {
        width: options.width,
        height: options.height,
      };
      if (options.negativePrompt) parameters.negative_prompt = options.negativePrompt;
      if (options.seed != null) parameters.seed = options.seed;

      // Inference Providers router — returns raw image bytes on success.
      const url = `${env.baseUrl}/hf-inference/models/${encodeURIComponent(model)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.token}`,
          "Content-Type": "application/json",
          Accept: "image/png, application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters,
        }),
        signal,
      });

      if (response.status === 429) {
        throw new AppError("PROVIDER_QUOTA_EXCEEDED", {
          details: { provider: this.name },
        });
      }
      if (response.status === 401 || response.status === 403) {
        throw new AppError("PROVIDER_UNAVAILABLE", {
          details: { provider: this.name, reason: "auth" },
        });
      }
      if (response.status === 503) {
        throw new AppError("PROVIDER_UNAVAILABLE", {
          details: { provider: this.name, reason: "loading" },
        });
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        if (/nsfw|safety|moderation|blocked|content/i.test(text)) {
          throw new AppError("CONTENT_BLOCKED");
        }
        logger.warn("huggingface_non_ok", {
          provider: this.name,
          status: response.status,
        });
        throw new AppError("PROVIDER_UNAVAILABLE", {
          details: { provider: this.name, status: response.status },
        });
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = (await response.json()) as {
          error?: string;
          estimated_time?: number;
        };
        if (json.error) {
          if (/rate|quota|limit/i.test(json.error)) {
            throw new AppError("PROVIDER_QUOTA_EXCEEDED");
          }
          throw new AppError("GENERATION_FAILED", {
            details: { provider: this.name },
          });
        }
        throw new AppError("GENERATION_FAILED", {
          details: { provider: this.name, reason: "unexpected_json" },
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer.byteLength) {
        throw new AppError("GENERATION_FAILED", {
          details: { provider: this.name, reason: "empty_body" },
        });
      }

      return {
        imageBytes: Buffer.from(arrayBuffer),
        contentType: contentType.startsWith("image/") ? contentType : "image/png",
        provider: this.name,
        model,
        seed: options.seed,
        metadata: {
          width: options.width,
          height: options.height,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("PROVIDER_TIMEOUT", {
          details: { provider: this.name },
        });
      }
      logger.error("huggingface_generate_failed", {
        provider: this.name,
        errorCategory: "provider",
      });
      throw new AppError("PROVIDER_UNAVAILABLE", {
        cause: error,
        details: { provider: this.name },
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
