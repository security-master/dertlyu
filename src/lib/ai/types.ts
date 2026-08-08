export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio?: string;
  seed?: number;
  model?: string;
  style?: string;
  signal?: AbortSignal;
}

export interface ImageGenerationResult {
  /** Raw image bytes when the provider returns binary/base64. */
  imageBytes?: Buffer;
  /** Temporary provider URL when bytes are not immediately available. */
  imageUrl?: string;
  contentType?: string;
  provider: string;
  model?: string;
  seed?: number;
  metadata?: Record<string, unknown>;
}

export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export const ASPECT_RATIOS = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

export const STYLES = [
  "auto",
  "realistic",
  "cinematic",
  "illustration",
  "anime",
  "3d",
  "watercolor",
] as const;

export type StyleOption = (typeof STYLES)[number];

export const RESOLUTIONS = [
  { label: "512 × 512", width: 512, height: 512 },
  { label: "768 × 768", width: 768, height: 768 },
  { label: "1024 × 1024", width: 1024, height: 1024 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "720 × 1280", width: 720, height: 1280 },
] as const;

export function applyStyleToPrompt(prompt: string, style?: string): string {
  if (!style || style === "auto") return prompt;
  const suffixes: Record<string, string> = {
    realistic: "photorealistic, natural lighting, highly detailed",
    cinematic: "cinematic composition, dramatic lighting, film still",
    illustration: "digital illustration, clean lines, vibrant colors",
    anime: "anime style, expressive, detailed character art",
    "3d": "3D render, octane, soft global illumination",
    watercolor: "watercolor painting, soft washes, paper texture",
  };
  const suffix = suffixes[style];
  return suffix ? `${prompt.trim()}, ${suffix}` : prompt;
}
