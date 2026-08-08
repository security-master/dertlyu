import type {
  CreateGenerationInput,
  GenerationRecord,
  GenerationRepository,
  UpdateGenerationInput,
} from "./types";

const records = new Map<string, GenerationRecord>();

export class MemoryGenerationRepository implements GenerationRepository {
  async create(input: CreateGenerationInput): Promise<GenerationRecord> {
    const record: GenerationRecord = {
      id: input.id,
      userId: input.userId,
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
      thumbnailUrl: null,
      status: input.status ?? "queued",
      errorCode: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    records.set(record.id, record);
    return { ...record };
  }

  async update(
    id: string,
    input: UpdateGenerationInput,
  ): Promise<GenerationRecord | null> {
    const existing = records.get(id);
    if (!existing) return null;
    const next = { ...existing, ...input };
    records.set(id, next);
    return { ...next };
  }

  async findById(id: string): Promise<GenerationRecord | null> {
    const record = records.get(id);
    return record ? { ...record } : null;
  }

  async listByUser(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<GenerationRecord[]> {
    const limit = options?.limit ?? 48;
    const offset = options?.offset ?? 0;
    return [...records.values()]
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(offset, offset + limit)
      .map((r) => ({ ...r }));
  }
}

export function clearMemoryGenerations() {
  records.clear();
}

let memorySingleton: MemoryGenerationRepository | null = null;

export function getMemoryRepository(): MemoryGenerationRepository {
  if (!memorySingleton) memorySingleton = new MemoryGenerationRepository();
  return memorySingleton;
}
