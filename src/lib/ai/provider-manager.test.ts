import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ImageGenerationResult, ImageProvider } from "@/types/generation";
import { ProviderManager } from "@/lib/ai/provider-manager";
import { AppError } from "@/lib/errors/app-error";

function createMockProvider(
  name: string,
  available: boolean,
  result?: ImageGenerationResult,
  error?: Error
): ImageProvider {
  return {
    name,
    isAvailable: () => available,
    generate: vi.fn(async () => {
      if (error) throw error;
      return result!;
    }),
  };
}

describe("ProviderManager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result from primary provider on success", async () => {
    const mockResult: ImageGenerationResult = {
      imageData: Buffer.from("fake-image"),
      contentType: "image/png",
      provider: "pollinations",
      model: "flux",
    };

    const primary = createMockProvider("pollinations", true, mockResult);
    const fallback = createMockProvider("huggingface", true);

    const manager = new ProviderManager();
    // Replace internal providers for testing
    (manager as unknown as { providers: Map<string, ImageProvider> }).providers =
      new Map([
        ["pollinations", primary],
        ["huggingface", fallback],
      ]);
    (manager as unknown as { primaryName: string }).primaryName = "pollinations";
    (manager as unknown as { fallbackName: string | undefined }).fallbackName =
      "huggingface";

    const result = await manager.generate({
      prompt: "test",
      width: 512,
      height: 512,
    });

    expect(result.provider).toBe("pollinations");
    expect(primary.generate).toHaveBeenCalledOnce();
    expect(fallback.generate).not.toHaveBeenCalled();
  });

  it("falls back to secondary provider when primary fails", async () => {
    const mockResult: ImageGenerationResult = {
      imageData: Buffer.from("fake-image"),
      contentType: "image/png",
      provider: "huggingface",
      model: "sdxl",
    };

    const primary = createMockProvider(
      "pollinations",
      true,
      undefined,
      new AppError("PROVIDER_UNAVAILABLE")
    );
    const fallback = createMockProvider("huggingface", true, mockResult);

    const manager = new ProviderManager();
    (manager as unknown as { providers: Map<string, ImageProvider> }).providers =
      new Map([
        ["pollinations", primary],
        ["huggingface", fallback],
      ]);
    (manager as unknown as { primaryName: string }).primaryName = "pollinations";
    (manager as unknown as { fallbackName: string | undefined }).fallbackName =
      "huggingface";

    const result = await manager.generate({
      prompt: "test",
      width: 512,
      height: 512,
    });

    expect(result.provider).toBe("huggingface");
    expect(primary.generate).toHaveBeenCalled();
    expect(fallback.generate).toHaveBeenCalled();
  });

  it("throws when all providers fail", async () => {
    const primary = createMockProvider(
      "pollinations",
      true,
      undefined,
      new AppError("GENERATION_FAILED")
    );
    const fallback = createMockProvider(
      "huggingface",
      true,
      undefined,
      new AppError("GENERATION_FAILED")
    );

    const manager = new ProviderManager();
    (manager as unknown as { providers: Map<string, ImageProvider> }).providers =
      new Map([
        ["pollinations", primary],
        ["huggingface", fallback],
      ]);
    (manager as unknown as { primaryName: string }).primaryName = "pollinations";
    (manager as unknown as { fallbackName: string | undefined }).fallbackName =
      "huggingface";

    await expect(
      manager.generate({ prompt: "test", width: 512, height: 512 })
    ).rejects.toThrow(AppError);
  });
});
