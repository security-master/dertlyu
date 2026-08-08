import { describe, it, expect } from "vitest";
import { generateRequestSchema, validatePromptSafety } from "@/lib/validation/generate";

describe("generateRequestSchema", () => {
  it("accepts valid request", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "A beautiful sunset",
      width: 1024,
      height: 1024,
      aspectRatio: "1:1",
      style: "realistic",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty prompt", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "",
      width: 1024,
      height: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized dimensions", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "test",
      width: 4096,
      height: 4096,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid aspect ratio", () => {
    const result = generateRequestSchema.safeParse({
      prompt: "test",
      width: 1024,
      height: 1024,
      aspectRatio: "2:3",
    });
    expect(result.success).toBe(false);
  });
});

describe("validatePromptSafety", () => {
  it("blocks unsafe prompts", () => {
    expect(validatePromptSafety("normal prompt")).toBe(true);
    expect(validatePromptSafety("blocked content")).toBe(true);
  });
});
