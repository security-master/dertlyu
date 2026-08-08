interface StoredImage {
  data: Buffer;
  contentType: string;
  createdAt: number;
}

const MAX_ENTRIES = 250;
const store = new Map<string, StoredImage>();

export function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL === "1" ||
      process.env.VERCEL_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY
  );
}

export function putImage(key: string, data: Buffer, contentType: string): void {
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(key, {
    data,
    contentType,
    createdAt: Date.now(),
  });
}

export function getImage(key: string): StoredImage | null {
  return store.get(key) ?? null;
}

export function hasImage(key: string): boolean {
  return store.has(key);
}
