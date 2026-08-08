import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { getEnv, type ImageProviderName } from "@/lib/config/env";
import type { ImageProvider } from "./provider";
import { HuggingFaceProvider } from "./providers/huggingface";
import { PollinationsProvider } from "./providers/pollinations";
import type { ImageGenerationOptions, ImageGenerationResult } from "./types";

const MAX_ATTEMPTS_PER_PROVIDER = 2;

export class ProviderManager {
  private readonly providers: Map<string, ImageProvider>;

  constructor(providers?: ImageProvider[]) {
    const list = providers ?? [new PollinationsProvider(), new HuggingFaceProvider()];
    this.providers = new Map(list.map((p) => [p.name, p]));
  }

  listAvailable(): string[] {
    return [...this.providers.values()]
      .filter((p) => p.isAvailable())
      .map((p) => p.name);
  }

  getProvider(name: string): ImageProvider | undefined {
    return this.providers.get(name);
  }

  private orderedProviders(): ImageProvider[] {
    const env = getEnv();
    const order: ImageProviderName[] = [env.primaryProvider];
    if (env.fallbackProvider && env.fallbackProvider !== env.primaryProvider) {
      order.push(env.fallbackProvider);
    }
    for (const name of this.providers.keys()) {
      if (!order.includes(name as ImageProviderName)) {
        order.push(name as ImageProviderName);
      }
    }

    return order
      .map((name) => this.providers.get(name))
      .filter((p): p is ImageProvider => Boolean(p && p.isAvailable()));
  }

  async generate(
    options: ImageGenerationOptions,
    context?: { requestId?: string; generationId?: string },
  ): Promise<ImageGenerationResult> {
    const available = this.orderedProviders();
    if (available.length === 0) {
      throw new AppError("PROVIDER_UNAVAILABLE", {
        message: "No image providers are configured.",
      });
    }

    const failures: Array<{ provider: string; code: string }> = [];

    for (const provider of available) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
        const started = Date.now();
        try {
          logger.info("provider_attempt", {
            requestId: context?.requestId,
            generationId: context?.generationId,
            provider: provider.name,
            attempt,
          });
          const result = await provider.generate(options);
          logger.info("provider_success", {
            requestId: context?.requestId,
            generationId: context?.generationId,
            provider: provider.name,
            model: result.model,
            durationMs: Date.now() - started,
            status: "completed",
          });
          return result;
        } catch (error) {
          const appError =
            error instanceof AppError
              ? error
              : new AppError("GENERATION_FAILED", { cause: error });

          logger.warn("provider_failure", {
            requestId: context?.requestId,
            generationId: context?.generationId,
            provider: provider.name,
            attempt,
            durationMs: Date.now() - started,
            errorCategory: appError.code,
            status: "failed",
          });

          failures.push({ provider: provider.name, code: appError.code });

          // Do not retry content policy or invalid requests on the same provider.
          if (
            appError.code === "CONTENT_BLOCKED" ||
            appError.code === "INVALID_REQUEST"
          ) {
            throw appError;
          }

          // Retry only transient failures once.
          const transient =
            appError.code === "PROVIDER_TIMEOUT" ||
            appError.code === "PROVIDER_UNAVAILABLE" ||
            appError.code === "PROVIDER_QUOTA_EXCEEDED";
          if (!transient || attempt >= MAX_ATTEMPTS_PER_PROVIDER) {
            break;
          }
        }
      }
    }

    logger.error("all_providers_failed", {
      requestId: context?.requestId,
      generationId: context?.generationId,
      failures,
    });

    const last = failures[failures.length - 1];
    if (last?.code === "PROVIDER_QUOTA_EXCEEDED") {
      throw new AppError("PROVIDER_QUOTA_EXCEEDED");
    }
    if (last?.code === "PROVIDER_TIMEOUT") {
      throw new AppError("PROVIDER_TIMEOUT");
    }
    throw new AppError("PROVIDER_UNAVAILABLE");
  }
}

let singleton: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!singleton) singleton = new ProviderManager();
  return singleton;
}

/** Test helper */
export function createProviderManager(providers: ImageProvider[]): ProviderManager {
  return new ProviderManager(providers);
}
