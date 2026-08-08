import { z } from "zod";
import { ASPECT_RATIOS, STYLES } from "@/lib/ai/types";

const MAX_PROMPT = 2000;
const MAX_NEGATIVE = 1000;
const ALLOWED_WIDTHS = new Set([512, 640, 768, 832, 896, 1024, 1152, 1280]);
const ALLOWED_HEIGHTS = new Set([512, 640, 768, 832, 896, 1024, 1152, 1280]);

const baseSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(1, "Prompt is required.")
      .max(MAX_PROMPT, `Prompt must be at most ${MAX_PROMPT} characters.`),
    negativePrompt: z
      .string()
      .trim()
      .max(MAX_NEGATIVE, `Negative prompt must be at most ${MAX_NEGATIVE} characters.`)
      .optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    aspectRatio: z
      .enum(
        Object.keys(ASPECT_RATIOS) as [
          keyof typeof ASPECT_RATIOS,
          ...Array<keyof typeof ASPECT_RATIOS>,
        ],
      )
      .optional(),
    style: z.enum(STYLES).optional().default("auto"),
    model: z
      .string()
      .trim()
      .max(128)
      .regex(/^[a-zA-Z0-9._/:-]+$/, "Invalid model identifier.")
      .optional()
      .default("auto"),
    seed: z.number().int().min(0).max(2_147_483_647).optional(),
  })
  .strict();

export const generateRequestSchema = baseSchema.transform((value, ctx) => {
  let width = value.width;
  let height = value.height;

  if (value.aspectRatio && (!width || !height)) {
    const dims = ASPECT_RATIOS[value.aspectRatio];
    width = dims.width;
    height = dims.height;
  }

  width = width ?? 1024;
  height = height ?? 1024;

  if (!ALLOWED_WIDTHS.has(width) || !ALLOWED_HEIGHTS.has(height)) {
    ctx.addIssue({
      code: "custom",
      message: "Unsupported image dimensions.",
      path: ["width"],
    });
    return z.NEVER;
  }

  if (width * height > 1280 * 1280) {
    ctx.addIssue({
      code: "custom",
      message: "Image resolution is too large.",
      path: ["width"],
    });
    return z.NEVER;
  }

  return {
    prompt: value.prompt,
    negativePrompt: value.negativePrompt || undefined,
    width,
    height,
    aspectRatio: value.aspectRatio ?? inferAspectRatio(width, height),
    style: value.style ?? "auto",
    model: value.model ?? "auto",
    seed: value.seed,
  };
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

function inferAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.05) return "1:1";
  if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16";
  if (Math.abs(ratio - 4 / 3) < 0.08) return "4:3";
  if (Math.abs(ratio - 3 / 4) < 0.08) return "3:4";
  return `${width}:${height}`;
}

export const MAX_BODY_BYTES = 32_768;
