interface StoredGenerationImage {
  data: Buffer;
  contentType: string;
  createdAt: number;
}

const MAX_ENTRIES = 250;
const store = new Map<string, StoredGenerationImage>();

export function putGenerationImage(
  generationId: string,
  data: Buffer,
  contentType: string
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(generationId, {
    data,
    contentType,
    createdAt: Date.now(),
  });
}

export function getGenerationImage(generationId: string): StoredGenerationImage | null {
  return store.get(generationId) ?? null;
}

export function toDataUrl(data: Buffer, contentType: string): string {
  return `data:${contentType};base64,${data.toString("base64")}`;
}
