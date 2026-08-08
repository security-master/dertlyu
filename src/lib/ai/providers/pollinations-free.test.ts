import { describe, it, expect, vi, afterEach } from "vitest";
import { PollinationsFreeProvider } from "@/lib/ai/providers/pollinations-free";

describe("PollinationsFreeProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is always available without API key", () => {
    const provider = new PollinationsFreeProvider();
    expect(provider.isAvailable()).toBe(true);
  });

  it("generates image from free endpoint", async () => {
    const fakeImage = Buffer.from("fake-jpeg-data");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => fakeImage,
      })
    );

    const provider = new PollinationsFreeProvider();
    const result = await provider.generate({
      prompt: "red circle",
      width: 512,
      height: 512,
      model: "turbo",
    });

    expect(result.provider).toBe("pollinations-free");
    expect(result.model).toBe("turbo");
    expect(result.imageData.length).toBeGreaterThan(0);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("image.pollinations.ai");
    expect(calledUrl).toContain("model=turbo");
  });
});
