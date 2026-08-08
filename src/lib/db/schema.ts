import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    provider: varchar("provider", { length: 64 }),
    model: varchar("model", { length: 256 }),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    aspectRatio: varchar("aspect_ratio", { length: 16 }),
    style: varchar("style", { length: 64 }),
    seed: integer("seed"),
    imageUrl: text("image_url"),
    storageKey: text("storage_key"),
    thumbnailUrl: text("thumbnail_url"),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    errorCode: varchar("error_code", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("generations_user_id_idx").on(table.userId),
    index("generations_created_at_idx").on(table.createdAt),
    index("generations_status_idx").on(table.status),
  ],
);

export type GenerationRow = typeof generations.$inferSelect;
export type NewGenerationRow = typeof generations.$inferInsert;
