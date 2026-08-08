import { describe, it, expect } from "vitest";
import { getRandomPrompt, getRandomPromptCount } from "@/lib/prompts/random-prompts";

describe("random prompts", () => {
  it("generates non-empty prompts", () => {
    const prompt = getRandomPrompt();
    expect(prompt.length).toBeGreaterThan(10);
  });

  it("supports hundreds of unique combinations", () => {
    expect(getRandomPromptCount()).toBeGreaterThan(100);
  });

  it("generates varied prompts", () => {
    const prompts = new Set(Array.from({ length: 50 }, () => getRandomPrompt()));
    expect(prompts.size).toBeGreaterThan(40);
  });
});
