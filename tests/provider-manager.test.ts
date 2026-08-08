import { beforeEach, describe, expect, it } from "vitest";
import { createProviderManager } from "@/lib/ai/provider-manager";
import { AppError } from "@/lib/errors/app-error";
import {
  failingProvider,
  MockProvider,
  successResult,
} from "./helpers/mock-provider";

describe("ProviderManager", () => {
  beforeEach(() => {
    process.env.IMAGE_PROVIDER_PRIMARY = "primary";
    process.env.IMAGE_PROVIDER_FALLBACK = "fallback";
  });

  it("returns success from the primary provider", async () => {
    const primary = new MockProvider("primary", async () =>
      successResult("primary"),
    );
    const fallback = new MockProvider("fallback", async () =>
      successResult("fallback"),
    );
    const manager = createProviderManager([primary, fallback]);
    const result = await manager.generate({
      prompt: "a cat",
      width: 512,
      height: 512,
    });
    expect(result.provider).toBe("primary");
    expect(primary.calls).toBe(1);
    expect(fallback.calls).toBe(0);
  });

  it("falls back when primary fails", async () => {
    const primary = failingProvider("primary", "PROVIDER_UNAVAILABLE");
    const fallback = new MockProvider("fallback", async () =>
      successResult("fallback"),
    );
    const manager = createProviderManager([primary, fallback]);
    const result = await manager.generate({
      prompt: "a dog",
      width: 512,
      height: 512,
    });
    expect(result.provider).toBe("fallback");
    expect(fallback.calls).toBe(1);
  });

  it("throws when all providers fail", async () => {
    const manager = createProviderManager([
      failingProvider("primary"),
      failingProvider("fallback"),
    ]);
    await expect(
      manager.generate({ prompt: "x", width: 512, height: 512 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
