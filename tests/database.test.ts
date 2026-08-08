import { describe, expect, it } from "vitest";
import { MemoryGenerationRepository } from "@/lib/db/memory-repository";

describe("Generation repository", () => {
  it("creates and lists generation records for a user", async () => {
    const repo = new MemoryGenerationRepository();
    const created = await repo.create({
      id: "gen_1",
      userId: "user_a",
      prompt: "mountain lake",
      width: 1024,
      height: 1024,
      aspectRatio: "1:1",
      style: "realistic",
      status: "processing",
    });

    expect(created.id).toBe("gen_1");
    expect(created.status).toBe("processing");

    await repo.update("gen_1", {
      status: "completed",
      provider: "pollinations",
      model: "flux",
      imageUrl: "/api/images/generations/user_a/gen_1.png",
      storageKey: "generations/user_a/gen_1.png",
      completedAt: new Date().toISOString(),
    });

    const listed = await repo.listByUser("user_a");
    expect(listed).toHaveLength(1);
    expect(listed[0]?.status).toBe("completed");
    expect(listed[0]?.provider).toBe("pollinations");

    const other = await repo.listByUser("user_b");
    expect(other).toHaveLength(0);
  });
});
