import { z } from "zod";

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
export const STYLES = [
  "realistic",
  "anime",
  "digital-art",
  "photographic",
  "cinematic",
  "fantasy",
] as const;

export const RESOLUTIONS = [
  { label: "512 × 512", width: 512, height: 512 },
  { label: "768 × 768", width: 768, height: 768 },
  { label: "1024 × 1024", width: 1024, height: 1024 },
  { label: "1024 × 768", width: 1024, height: 768 },
  { label: "768 × 1024", width: 768, height: 1024 },
] as const;

const MAX_PROMPT_LENGTH = 2000;
const MAX_NEGATIVE_PROMPT_LENGTH = 1000;
const MIN_DIMENSION = 256;
const MAX_DIMENSION = 1536;

export const generateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(MAX_PROMPT_LENGTH, "Prompt is too long"),
  negativePrompt: z
    .string()
    .max(MAX_NEGATIVE_PROMPT_LENGTH, "Negative prompt is too long")
    .optional(),
  width: z
    .number()
    .int()
    .min(MIN_DIMENSION)
    .max(MAX_DIMENSION),
  height: z
    .number()
    .int()
    .min(MIN_DIMENSION)
    .max(MAX_DIMENSION),
  aspectRatio: z.enum(ASPECT_RATIOS).optional(),
  style: z.enum(STYLES).optional(),
  model: z.string().max(200).optional(),
  seed: z.number().int().min(0).max(2147483647).optional(),
});

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;

export const BLOCKED_PROMPT_PATTERNS = [
  /\bchild\s*porn/i,
  /\bcsam/i,
];

export function validatePromptSafety(prompt: string): boolean {
  return !BLOCKED_PROMPT_PATTERNS.some((pattern) => pattern.test(prompt));
}
