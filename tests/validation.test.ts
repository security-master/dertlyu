import { describe, expect, it } from "vitest";
import { generateRequestSchema } from "@/lib/generation/validation";

describe("generateRequestSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = generateRequestSchema.parse({
      prompt: "a quiet harbor",
      width: 1024,
      height: 1024,
      style: "realistic",
    });
    expect(parsed.width).toBe(1024);
    expect(parsed.style).toBe("realistic");
  });

  it("rejects unsupported dimensions", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "test",
      width: 99,
      height: 99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys like provider", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "test",
      provider: "pollinations",
    });
    expect(result.success).toBe(false);
  });
});
