import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProvider,
} from "@/types/generation";
import { HuggingFaceProvider } from "./providers/huggingface";
import { PollinationsFreeProvider } from "./providers/pollinations-free";
import { PollinationsProvider } from "./providers/pollinations";

const MAX_RETRIES = 2;

export class ProviderManager {
  private providers: Map<string, ImageProvider>;
  private primaryName: string;
  private fallbackName: string | undefined;

  constructor() {
    const env = getEnv();
    this.providers = new Map();
    this.primaryName = env.IMAGE_PROVIDER_PRIMARY;
    this.fallbackName = env.IMAGE_PROVIDER_FALLBACK;

    const pollinationsFree = new PollinationsFreeProvider();
    const pollinations = new PollinationsProvider();
    const huggingface = new HuggingFaceProvider();

    this.providers.set(pollinationsFree.name, pollinationsFree);
    this.providers.set(pollinations.name, pollinations);
    this.providers.set(huggingface.name, huggingface);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.values())
      .filter((p) => p.isAvailable())
      .map((p) => p.name);
  }

  async generate(
    options: ImageGenerationOptions,
    requestId?: string
  ): Promise<ImageGenerationResult> {
    const order = this.getProviderOrder();

    if (order.length === 0) {
      throw new AppError(
        "PROVIDER_NOT_CONFIGURED",
        "Hiçbir görüntü sağlayıcısı yapılandırılmamış. POLLINATIONS_API_KEY veya HF_TOKEN ekleyin."
      );
    }

    const errors: Array<{ provider: string; error: string }> = [];

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider || !provider.isAvailable()) continue;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const start = Date.now();

        try {
          logger.info("Attempting generation", {
            requestId,
            provider: providerName,
            attempt: attempt + 1,
          });

          const result = await provider.generate(options);

          logger.info("Generation succeeded", {
            requestId,
            provider: providerName,
            model: result.model,
            durationMs: Date.now() - start,
            status: "completed",
          });

          return result;
        } catch (error) {
          const durationMs = Date.now() - start;
          const errorCode =
            error instanceof AppError ? error.code : "GENERATION_FAILED";

          logger.warn("Provider attempt failed", {
            requestId,
            provider: providerName,
            attempt: attempt + 1,
            durationMs,
            errorCategory: errorCode,
          });

          errors.push({ provider: providerName, error: errorCode });

          const isTransient =
            errorCode === "PROVIDER_TIMEOUT" ||
            errorCode === "PROVIDER_UNAVAILABLE";

          if (!isTransient || attempt === MAX_RETRIES - 1) {
            break;
          }
        }
      }
    }

    logger.error("All providers failed", {
      requestId,
      errorCategory: "all_providers_failed",
      errors,
    });

    const lastError = errors[errors.length - 1]?.error ?? "GENERATION_FAILED";
    throw new AppError(lastError as AppError["code"]);
  }

  private getProviderOrder(): string[] {
    const order: string[] = [];

    if (this.primaryName) {
      order.push(this.primaryName);
    }

    if (this.fallbackName && this.fallbackName !== this.primaryName) {
      order.push(this.fallbackName);
    }

    for (const name of this.providers.keys()) {
      if (!order.includes(name)) {
        order.push(name);
      }
    }

    return order.filter((name) => {
      const provider = this.providers.get(name);
      return provider?.isAvailable();
    });
  }
}

let managerInstance: ProviderManager | null = null;

export function getProviderManager(): ProviderManager {
  if (!managerInstance) {
    managerInstance = new ProviderManager();
  }
  return managerInstance;
}
