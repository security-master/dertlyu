import type { GenerationStatus } from "@/types/generation";

export interface GenerationData {
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

export interface CreateGenerationInput {
  userId?: string | null;
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
  status?: GenerationStatus;
  errorCode?: string | null;
  completedAt?: Date | null;
}

export interface GenerationRepository {
  create(input: CreateGenerationInput): Promise<GenerationData>;
  update(id: string, input: UpdateGenerationInput): Promise<GenerationData>;
  findById(id: string): Promise<GenerationData | null>;
  findByUserId(userId: string, limit?: number): Promise<GenerationData[]>;
  findRecent(limit?: number): Promise<GenerationData[]>;
}
