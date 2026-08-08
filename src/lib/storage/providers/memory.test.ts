import { describe, it, expect } from "vitest";
import { getImage, putImage } from "@/lib/storage/image-cache";
import { MemoryStorageProvider } from "@/lib/storage/providers/memory";

describe("MemoryStorageProvider", () => {
  it("stores and retrieves images via cache", async () => {
    const provider = new MemoryStorageProvider("http://localhost:3000");
    const data = Buffer.from("test-image-data");

    const result = await provider.upload({
      key: "test/image.jpg",
      data,
      contentType: "image/jpeg",
    });

    expect(result.url).toContain("/api/images/test/image.jpg");

    const cached = getImage("test/image.jpg");
    expect(cached?.data.equals(data)).toBe(true);
    expect(cached?.contentType).toBe("image/jpeg");
  });

  it("putImage overwrites existing key", () => {
    putImage("key1", Buffer.from("a"), "image/png");
    putImage("key1", Buffer.from("bb"), "image/jpeg");
    const cached = getImage("key1");
    expect(cached?.contentType).toBe("image/jpeg");
  });
});
