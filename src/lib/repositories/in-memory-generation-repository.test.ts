import { describe, it, expect } from "vitest";
import { InMemoryGenerationRepository } from "@/lib/repositories/in-memory-generation-repository";

describe("InMemoryGenerationRepository", () => {
  it("creates and retrieves generation records", async () => {
    const repo = new InMemoryGenerationRepository();

    const created = await repo.create({
      prompt: "test prompt",
      width: 512,
      height: 512,
      status: "processing",
    });

    expect(created.id).toBeDefined();
    expect(created.prompt).toBe("test prompt");
    expect(created.status).toBe("processing");

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.prompt).toBe("test prompt");
  });

  it("updates generation status", async () => {
    const repo = new InMemoryGenerationRepository();

    const created = await repo.create({
      prompt: "test",
      width: 512,
      height: 512,
    });

    const updated = await repo.update(created.id, {
      status: "completed",
      provider: "pollinations",
      imageUrl: "https://example.com/image.png",
      completedAt: new Date(),
    });

    expect(updated.status).toBe("completed");
    expect(updated.provider).toBe("pollinations");
  });

  it("isolates user generations", async () => {
    const repo = new InMemoryGenerationRepository();

    await repo.create({
      userId: "user-1",
      prompt: "user1 image",
      width: 512,
      height: 512,
    });

    await repo.create({
      userId: "user-2",
      prompt: "user2 image",
      width: 512,
      height: 512,
    });

    const user1Gens = await repo.findByUserId("user-1");
    expect(user1Gens.length).toBe(1);
    expect(user1Gens[0].prompt).toBe("user1 image");
  });
});
