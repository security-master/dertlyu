import type { ImageGenerationOptions, ImageGenerationResult } from "./types";

export interface ImageProvider {
  readonly name: string;
  isAvailable(): boolean;
  generate(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}
