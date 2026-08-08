import type { ImageProvider } from "@/lib/ai/provider";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
} from "@/lib/ai/types";
import { AppError } from "@/lib/errors/app-error";

export class MockProvider implements ImageProvider {
  readonly name: string;
  private readonly impl: (
    options: ImageGenerationOptions,
  ) => Promise<ImageGenerationResult>;
  available: boolean;
  calls = 0;

  constructor(
    name: string,
    impl: (options: ImageGenerationOptions) => Promise<ImageGenerationResult>,
    available = true,
  ) {
    this.name = name;
    this.impl = impl;
    this.available = available;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    this.calls += 1;
    return this.impl(options);
  }
}

export function tinyPng(): Buffer {
  // 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

export function successResult(
  provider: string,
  overrides?: Partial<ImageGenerationResult>,
): ImageGenerationResult {
  return {
    imageBytes: tinyPng(),
    contentType: "image/png",
    provider,
    model: "mock-model",
    metadata: {},
    ...overrides,
  };
}

export function failingProvider(
  name: string,
  code:
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_TIMEOUT"
    | "PROVIDER_QUOTA_EXCEEDED"
    | "GENERATION_FAILED" = "PROVIDER_UNAVAILABLE",
) {
  return new MockProvider(name, async () => {
    throw new AppError(code, { details: { provider: name } });
  });
}
