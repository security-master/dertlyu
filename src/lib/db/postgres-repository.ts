import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/config/env";
import { generations } from "./schema";
import type {
  CreateGenerationInput,
  GenerationRecord,
  GenerationRepository,
  UpdateGenerationInput,
} from "./types";

type Db = ReturnType<typeof createDb>;

function createDb(connectionString: string) {
  const pool = new Pool({ connectionString, max: 5 });
  return drizzle({ client: pool });
}

function mapRow(row: typeof generations.$inferSelect): GenerationRecord {
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
    thumbnailUrl: row.thumbnailUrl,
    status: row.status as GenerationRecord["status"],
    errorCode: row.errorCode,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export class PostgresGenerationRepository implements GenerationRepository {
  constructor(private readonly db: Db) {}

  async create(input: CreateGenerationInput): Promise<GenerationRecord> {
    const [row] = await this.db
      .insert(generations)
      .values({
        id: input.id,
        userId: input.userId,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt ?? null,
        width: input.width,
        height: input.height,
        aspectRatio: input.aspectRatio ?? null,
        style: input.style ?? null,
        seed: input.seed ?? null,
        status: input.status ?? "queued",
      })
      .returning();
    return mapRow(row);
  }

  async update(
    id: string,
    input: UpdateGenerationInput,
  ): Promise<GenerationRecord | null> {
    const [row] = await this.db
      .update(generations)
      .set({
        ...(input.provider !== undefined ? { provider: input.provider } : {}),
        ...(input.model !== undefined ? { model: input.model } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.storageKey !== undefined
          ? { storageKey: input.storageKey }
          : {}),
        ...(input.thumbnailUrl !== undefined
          ? { thumbnailUrl: input.thumbnailUrl }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.errorCode !== undefined ? { errorCode: input.errorCode } : {}),
        ...(input.seed !== undefined ? { seed: input.seed } : {}),
        ...(input.completedAt !== undefined
          ? {
              completedAt: input.completedAt
                ? new Date(input.completedAt)
                : null,
            }
          : {}),
      })
      .where(eq(generations.id, id))
      .returning();
    return row ? mapRow(row) : null;
  }

  async findById(id: string): Promise<GenerationRecord | null> {
    const [row] = await this.db
      .select()
      .from(generations)
      .where(eq(generations.id, id))
      .limit(1);
    return row ? mapRow(row) : null;
  }

  async listByUser(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<GenerationRecord[]> {
    const limit = options?.limit ?? 48;
    const offset = options?.offset ?? 0;
    const rows = await this.db
      .select()
      .from(generations)
      .where(eq(generations.userId, userId))
      .orderBy(desc(generations.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map(mapRow);
  }
}

let postgresRepo: PostgresGenerationRepository | null = null;

export function getPostgresRepository(): PostgresGenerationRepository | null {
  const url = getEnv().databaseUrl;
  if (!url) return null;
  if (!postgresRepo) {
    postgresRepo = new PostgresGenerationRepository(createDb(url));
  }
  return postgresRepo;
}
