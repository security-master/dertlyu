import { desc, eq } from "drizzle-orm";
import { getDb } from "@/database";
import { generations } from "@/database/schema";
import type {
  CreateGenerationInput,
  GenerationData,
  GenerationRepository,
  UpdateGenerationInput,
} from "./generation-repository";

function mapRow(row: typeof generations.$inferSelect): GenerationData {
  return {
    id: row.id,
    userId: row.userId,
    prompt: row.prompt,
    negativePrompt: row.negativePrompt,
    provider: row.provider,
    model: row.model,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspectRatio,
    style: row.style,
    seed: row.seed,
    imageUrl: row.imageUrl,
    storageKey: row.storageKey,
    status: row.status as GenerationData["status"],
    errorCode: row.errorCode,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export class DrizzleGenerationRepository implements GenerationRepository {
  async create(input: CreateGenerationInput): Promise<GenerationData> {
    const db = getDb();
    const [row] = await db
      .insert(generations)
      .values({
        userId: input.userId ?? null,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt ?? null,
        width: input.width,
        height: input.height,
        aspectRatio: input.aspectRatio ?? null,
        style: input.style ?? null,
        seed: input.seed ?? null,
        status: input.status ?? "processing",
      })
      .returning();

    return mapRow(row);
  }

  async update(id: string, input: UpdateGenerationInput): Promise<GenerationData> {
    const db = getDb();
    const [row] = await db
      .update(generations)
      .set({
        provider: input.provider,
        model: input.model,
        imageUrl: input.imageUrl,
        storageKey: input.storageKey,
        status: input.status,
        errorCode: input.errorCode,
        completedAt: input.completedAt,
      })
      .where(eq(generations.id, id))
      .returning();

    if (!row) {
      throw new Error(`Generation ${id} not found`);
    }

    return mapRow(row);
  }

  async findById(id: string): Promise<GenerationData | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(generations)
      .where(eq(generations.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<GenerationData[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(generations)
      .where(eq(generations.userId, userId))
      .orderBy(desc(generations.createdAt))
      .limit(limit);

    return rows.map(mapRow);
  }

  async findRecent(limit = 50): Promise<GenerationData[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(generations)
      .orderBy(desc(generations.createdAt))
      .limit(limit);

    return rows.map(mapRow);
  }
}
