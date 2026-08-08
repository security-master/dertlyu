import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { getEnv } from "@/lib/config/env";
import type { ImageProvider } from "../provider";
import type { ImageGenerationOptions, ImageGenerationResult } from "../types";
import { applyStyleToPrompt } from "../types";

export class PollinationsProvider implements ImageProvider {
  readonly name = "pollinations";

  isAvailable(): boolean {
    // Pollinations can work without a key for some public models; key is preferred.
    return true;
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const env = getEnv().pollinations;
    const model =
      options.model && options.model !== "auto" ? options.model : env.model;
    const prompt = applyStyleToPrompt(options.prompt, options.style);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;

    try {
      const size = `${options.width}x${options.height}`;
      const body: Record<string, unknown> = {
        prompt,
        model,
        n: 1,
        size,
        response_format: "b64_json",
      };
      if (options.seed != null) body.seed = options.seed;
      if (options.negativePrompt) {
        // Pollinations accepts negative guidance via prompt extension when unsupported.
        body.prompt = `${prompt}. Avoid: ${options.negativePrompt}`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (env.apiKey) {
        headers.Authorization = `Bearer ${env.apiKey}`;
      }

      const response = await fetch(`${env.baseUrl}/v1/images/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
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
      if (response.status === 400 || response.status === 422) {
        const text = await response.text().catch(() => "");
        if (/nsfw|safety|moderation|blocked|content/i.test(text)) {
          throw new AppError("CONTENT_BLOCKED");
        }
        throw new AppError("GENERATION_FAILED", {
          details: { provider: this.name, status: response.status },
        });
      }
      if (!response.ok) {
        throw new AppError("PROVIDER_UNAVAILABLE", {
          details: { provider: this.name, status: response.status },
        });
      }

      const data = (await response.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
        model?: string;
      };

      const first = data.data?.[0];
      if (!first) {
        throw new AppError("GENERATION_FAILED", {
          details: { provider: this.name, reason: "empty_response" },
        });
      }

      if (first.b64_json) {
        const imageBytes = Buffer.from(first.b64_json, "base64");
        return {
          imageBytes,
          contentType: "image/jpeg",
          provider: this.name,
          model: data.model ?? model,
          seed: options.seed,
          metadata: { size },
        };
      }

      if (first.url) {
        const imageResponse = await fetch(first.url, { signal });
        if (!imageResponse.ok) {
          throw new AppError("GENERATION_FAILED", {
            details: { provider: this.name, reason: "url_fetch_failed" },
          });
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        return {
          imageBytes: Buffer.from(arrayBuffer),
          contentType: imageResponse.headers.get("content-type") ?? "image/jpeg",
          provider: this.name,
          model: data.model ?? model,
          seed: options.seed,
          metadata: { size, source: "url" },
        };
      }

      throw new AppError("GENERATION_FAILED", {
        details: { provider: this.name, reason: "malformed_response" },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("PROVIDER_TIMEOUT", {
          details: { provider: this.name },
        });
      }
      logger.error("pollinations_generate_failed", {
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
