import { randomUUID } from "crypto";
import type {
  CreateGenerationInput,
  GenerationData,
  GenerationRepository,
  UpdateGenerationInput,
} from "./generation-repository";

export class InMemoryGenerationRepository implements GenerationRepository {
  private store = new Map<string, GenerationData>();

  async create(input: CreateGenerationInput): Promise<GenerationData> {
    const id = randomUUID();
    const record: GenerationData = {
      id,
      userId: input.userId ?? null,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt ?? null,
      provider: null,
      model: null,
      width: input.width,
      height: input.height,
      aspectRatio: input.aspectRatio ?? null,
      style: input.style ?? null,
      seed: input.seed ?? null,
      imageUrl: null,
      storageKey: null,
      status: input.status ?? "processing",
      errorCode: null,
      createdAt: new Date(),
      completedAt: null,
    };

    this.store.set(id, record);
    return record;
  }

  async update(id: string, input: UpdateGenerationInput): Promise<GenerationData> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Generation ${id} not found`);
    }

    const updated: GenerationData = {
      ...existing,
      ...input,
      provider: input.provider ?? existing.provider,
      model: input.model ?? existing.model,
      imageUrl: input.imageUrl ?? existing.imageUrl,
      storageKey: input.storageKey ?? existing.storageKey,
      status: input.status ?? existing.status,
      errorCode: input.errorCode ?? existing.errorCode,
      completedAt: input.completedAt ?? existing.completedAt,
    };

    this.store.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<GenerationData | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string, limit = 50): Promise<GenerationData[]> {
    return Array.from(this.store.values())
      .filter((g) => g.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async findRecent(limit = 50): Promise<GenerationData[]> {
    return Array.from(this.store.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
