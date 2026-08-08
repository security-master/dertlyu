CREATE TABLE IF NOT EXISTS "generations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(128) NOT NULL,
  "prompt" text NOT NULL,
  "negative_prompt" text,
  "provider" varchar(64),
  "model" varchar(256),
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "aspect_ratio" varchar(16),
  "style" varchar(64),
  "seed" integer,
  "image_url" text,
  "storage_key" text,
  "thumbnail_url" text,
  "status" varchar(32) DEFAULT 'queued' NOT NULL,
  "error_code" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "generations_user_id_idx" ON "generations" ("user_id");
CREATE INDEX IF NOT EXISTS "generations_created_at_idx" ON "generations" ("created_at");
CREATE INDEX IF NOT EXISTS "generations_status_idx" ON "generations" ("status");
