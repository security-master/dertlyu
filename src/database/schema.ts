import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  uuid,
} from "drizzle-orm/pg-core";

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    provider: text("provider"),
    model: text("model"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    aspectRatio: text("aspect_ratio"),
    style: text("style"),
    seed: integer("seed"),
    imageUrl: text("image_url"),
    storageKey: text("storage_key"),
    status: text("status").notNull().default("queued"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("generations_user_id_idx").on(table.userId),
    index("generations_created_at_idx").on(table.createdAt),
    index("generations_status_idx").on(table.status),
  ]
);

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
