export type ImageProviderName = "pollinations" | "huggingface";
export type StorageProviderName = "local" | "blobs" | "r2" | "memory";

function read(name: string): string | undefined {
  const value = process.env[name];
  if (value == null || value.trim() === "") return undefined;
  return value.trim();
}

export function getEnv() {
  const primary = (read("IMAGE_PROVIDER_PRIMARY") ?? "pollinations") as ImageProviderName;
  const fallback = read("IMAGE_PROVIDER_FALLBACK") as ImageProviderName | undefined;

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    primaryProvider: primary,
    fallbackProvider: fallback,
    pollinations: {
      apiKey: read("POLLINATIONS_API_KEY"),
      baseUrl: read("POLLINATIONS_BASE_URL") ?? "https://gen.pollinations.ai",
      model: read("POLLINATIONS_MODEL") ?? "flux",
      timeoutMs: Number(read("POLLINATIONS_TIMEOUT_MS") ?? "90000"),
    },
    huggingface: {
      token: read("HF_TOKEN"),
      model: read("HF_IMAGE_MODEL") ?? "black-forest-labs/FLUX.1-schnell",
      baseUrl: read("HF_API_BASE_URL") ?? "https://router.huggingface.co",
      timeoutMs: Number(read("HF_TIMEOUT_MS") ?? "120000"),
    },
    databaseUrl: read("DATABASE_URL") ?? read("NETLIFY_DB_URL"),
    storage: {
      provider: (read("STORAGE_PROVIDER") ??
        (process.env.NETLIFY === "true" || process.env.NETLIFY_DEV === "true"
          ? "blobs"
          : "local")) as StorageProviderName,
      localDir: read("LOCAL_STORAGE_DIR") ?? ".data/images",
      blobsStore: read("BLOBS_STORE_NAME") ?? "generated-images",
      r2: {
        accountId: read("R2_ACCOUNT_ID"),
        accessKeyId: read("R2_ACCESS_KEY_ID"),
        secretAccessKey: read("R2_SECRET_ACCESS_KEY"),
        bucket: read("R2_BUCKET"),
        publicUrl: read("R2_PUBLIC_URL"),
        endpoint: read("R2_ENDPOINT"),
      },
    },
    rateLimit: {
      anonymousPerHour: Number(read("RATE_LIMIT_ANON_PER_HOUR") ?? "10"),
      authenticatedPerHour: Number(read("RATE_LIMIT_AUTH_PER_HOUR") ?? "60"),
      upstashUrl: read("UPSTASH_REDIS_REST_URL"),
      upstashToken: read("UPSTASH_REDIS_REST_TOKEN"),
    },
    appUrl: read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
    sessionSecret: read("SESSION_SECRET") ?? "dev-only-session-secret-change-me",
  };
}

export type AppEnv = ReturnType<typeof getEnv>;

/** Validate optional provider/storage config without failing the whole app. */
export function describeProviderAvailability(env = getEnv()) {
  return {
    pollinations: true,
    huggingface: Boolean(env.huggingface.token),
    storage: env.storage.provider,
    database: Boolean(env.databaseUrl),
  };
}
