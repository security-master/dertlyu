import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryGenerationRepository } from "@/lib/db/memory-repository";
import { setGenerationRepositoryForTests } from "@/lib/db";
import { clearMemoryStorage, MemoryStorage } from "@/lib/storage/memory";
import { setImageStorageForTests } from "@/lib/storage";
import { resetRateLimitForTests } from "@/lib/rate-limit";
const mocks = vi.hoisted(() => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const manager = {
    generate: vi.fn(async () => ({
      imageBytes: png,
      contentType: "image/png",
      provider: "pollinations",
      model: "mock-model",
      metadata: {},
    })),
  };
  return { manager, png };
});

vi.mock("@/lib/auth/session", () => ({
  requireUser: async () => ({ id: "user_test_1", isAuthenticated: false }),
  getCurrentUser: async () => ({ id: "user_test_1", isAuthenticated: false }),
}));

vi.mock("@/lib/ai/provider-manager", () => ({
  getProviderManager: () => mocks.manager,
}));

describe("POST /api/generate", () => {
  beforeEach(() => {
    mocks.manager.generate.mockReset();
    mocks.manager.generate.mockImplementation(async () => ({
      imageBytes: mocks.png,
      contentType: "image/png",
      provider: "pollinations",
      model: "mock-model",
      metadata: {},
    }));
    setGenerationRepositoryForTests(new MemoryGenerationRepository());
    setImageStorageForTests(new MemoryStorage());
    clearMemoryStorage();
    resetRateLimitForTests();
    process.env.STORAGE_PROVIDER = "memory";
    process.env.RATE_LIMIT_ANON_PER_HOUR = "100";
  });

  it("rejects invalid requests", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "" }),
      }),
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects provider injection fields", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "a lighthouse",
          provider: "evil",
        }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("creates a generation successfully without leaking secrets", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "a lighthouse at dusk",
          width: 512,
          height: 512,
          style: "cinematic",
        }),
      }),
    );
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.imageUrl).toMatch(/^\/api\/images\//);
    expect(json.data.prompt).toBe("a lighthouse at dusk");
    expect(JSON.stringify(json)).not.toMatch(/hf_test|API_KEY|SECRET|Bearer/i);
    expect(json.data).not.toHaveProperty("providerResponse");
  });

  it("enforces rate limits", async () => {
    process.env.RATE_LIMIT_ANON_PER_HOUR = "1";
    resetRateLimitForTests();
    const { POST } = await import("@/app/api/generate/route");
    const body = {
      prompt: "rate limit me",
      width: 512,
      height: 512,
    };
    const first = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(first.status).toBe(201);
    const second = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(second.status).toBe(429);
    const json = await second.json();
    expect(json.error.code).toBe("RATE_LIMITED");
  });
});

describe("authorization", () => {
  it("forbids access to another user's generation", async () => {
    const repo = new MemoryGenerationRepository();
    setGenerationRepositoryForTests(repo);
    await repo.create({
      id: "gen_other",
      userId: "someone_else",
      prompt: "secret",
      width: 512,
      height: 512,
      status: "completed",
    });

    const { getGenerationForUser } = await import("@/lib/generation/service");
    await expect(
      getGenerationForUser("gen_other", "user_test_1"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
