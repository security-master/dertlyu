import type { GenerationStatus } from "@/lib/ai/types";

export interface GenerationRecord {
  id: string;
  userId: string;
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
  thumbnailUrl: string | null;
  status: GenerationStatus;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateGenerationInput {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string | null;
  width: number;
  height: number;
  aspectRatio?: string | null;
  style?: string | null;
  seed?: number | null;
  status?: GenerationStatus;
}

export interface UpdateGenerationInput {
  provider?: string | null;
  model?: string | null;
  imageUrl?: string | null;
  storageKey?: string | null;
  thumbnailUrl?: string | null;
  status?: GenerationStatus;
  errorCode?: string | null;
  completedAt?: string | null;
  seed?: number | null;
}

export interface GenerationRepository {
  create(input: CreateGenerationInput): Promise<GenerationRecord>;
  update(id: string, input: UpdateGenerationInput): Promise<GenerationRecord | null>;
  findById(id: string): Promise<GenerationRecord | null>;
  listByUser(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<GenerationRecord[]>;
}
