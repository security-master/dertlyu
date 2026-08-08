CREATE TABLE IF NOT EXISTS "generations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "prompt" text NOT NULL,
  "negative_prompt" text,
  "provider" text,
  "model" text,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "aspect_ratio" text,
  "style" text,
  "seed" integer,
  "image_url" text,
  "storage_key" text,
  "status" text DEFAULT 'queued' NOT NULL,
  "error_code" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "generations_user_id_idx" ON "generations" ("user_id");
CREATE INDEX IF NOT EXISTS "generations_created_at_idx" ON "generations" ("created_at");
CREATE INDEX IF NOT EXISTS "generations_status_idx" ON "generations" ("status");
