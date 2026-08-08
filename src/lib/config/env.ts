import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Provider configuration
  IMAGE_PROVIDER_PRIMARY: z.string().default("pollinations-free"),
  IMAGE_PROVIDER_FALLBACK: z.string().optional().default("pollinations"),

  POLLINATIONS_API_KEY: z.string().optional(),
  POLLINATIONS_BASE_URL: z.string().default("https://gen.pollinations.ai"),
  POLLINATIONS_MODEL: z.string().default("flux"),
  POLLINATIONS_TIMEOUT_MS: z.coerce.number().default(120000),

  HF_TOKEN: z.string().optional(),
  HF_IMAGE_MODEL: z.string().default("stabilityai/stable-diffusion-xl-base-1.0"),
  HF_TIMEOUT_MS: z.coerce.number().default(120000),

  // Database
  DATABASE_URL: z.string().optional(),

  // Supabase (optional auth + storage)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Storage (memory on Vercel, local disk on dev)
  STORAGE_PROVIDER: z.enum(["local", "memory", "s3", "supabase"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("./storage"),
  STORAGE_PUBLIC_URL: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RATE_LIMIT_ANONYMOUS: z.coerce.number().default(10),
  RATE_LIMIT_AUTHENTICATED: z.coerce.number().default(50),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(3600),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .filter((i) => i.code === "invalid_type" && i.received === "undefined")
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
    }
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  );
}
