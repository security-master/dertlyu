import { afterEach, describe, expect, it, vi } from "vitest";
import { PollinationsProvider } from "@/lib/ai/providers/pollinations";
import { HuggingFaceProvider } from "@/lib/ai/providers/huggingface";
import { AppError } from "@/lib/errors/app-error";

describe("PollinationsProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("normalizes a successful b64 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: [
            {
              b64_json: Buffer.from("fake-image").toString("base64"),
            },
          ],
          model: "flux",
        }),
      ),
    );

    const provider = new PollinationsProvider();
    const result = await provider.generate({
      prompt: "sunset",
      width: 512,
      height: 512,
    });
    expect(result.provider).toBe("pollinations");
    expect(result.model).toBe("flux");
    expect(result.imageBytes?.toString()).toBe("fake-image");
  });

  it("maps timeout to PROVIDER_TIMEOUT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      }),
    );
    process.env.POLLINATIONS_TIMEOUT_MS = "1";
    const provider = new PollinationsProvider();
    await expect(
      provider.generate({ prompt: "x", width: 512, height: 512 }),
    ).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
  });

  it("rejects malformed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: [] })),
    );
    const provider = new PollinationsProvider();
    await expect(
      provider.generate({ prompt: "x", width: 512, height: 512 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("HuggingFaceProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.HF_TOKEN;
  });

  it("is unavailable without token", () => {
    delete process.env.HF_TOKEN;
    expect(new HuggingFaceProvider().isAvailable()).toBe(false);
  });

  it("returns image bytes on success", async () => {
    process.env.HF_TOKEN = "hf_test_token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(Buffer.from("png-bytes"), {
          status: 200,
          headers: { "content-type": "image/png" },
        }),
      ),
    );
    const provider = new HuggingFaceProvider();
    const result = await provider.generate({
      prompt: "robot",
      width: 512,
      height: 512,
    });
    expect(result.provider).toBe("huggingface");
    expect(result.imageBytes?.toString()).toBe("png-bytes");
  });

  it("maps 429 to quota exceeded", async () => {
    process.env.HF_TOKEN = "hf_test_token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );
    const provider = new HuggingFaceProvider();
    await expect(
      provider.generate({ prompt: "x", width: 512, height: 512 }),
    ).rejects.toMatchObject({ code: "PROVIDER_QUOTA_EXCEEDED" });
  });
});
