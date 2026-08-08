export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio?: string;
  seed?: number;
  model?: string;
  style?: string;
}

export interface ImageGenerationResult {
  imageData: Buffer;
  contentType: string;
  provider: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface ImageProvider {
  readonly name: string;

  isAvailable(): boolean;

  generate(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}

export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export interface GenerationRecord {
  id: string;
  userId: string | null;
  prompt: string;
  negativePrompt: string | null;
  provider: string | null;
  model: string | null;
  width: number;
  height: number;
  aspectRatio: string | null;
  style: string | null;
  seed: number | null;
  imageUrl: string | null;
  storageKey: string | null;
  status: GenerationStatus;
  errorCode: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface GenerateApiRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  aspectRatio?: string;
  style?: string;
  model?: string;
  seed?: number;
}

export interface GenerateApiResponse {
  success: true;
  generation: {
    id: string;
    status: GenerationStatus;
    imageUrl: string | null;
    prompt: string;
    width: number;
    height: number;
    aspectRatio: string | null;
    style: string | null;
    model: string | null;
    provider: string | null;
    createdAt: string;
    completedAt: string | null;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
