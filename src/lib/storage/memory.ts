import type { ImageStorage, StoredObject } from "./types";

const store = new Map<string, { data: Buffer; contentType: string }>();

export class MemoryStorage implements ImageStorage {
  readonly name = "memory";

  async put(options: {
    key: string;
    data: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    store.set(options.key, {
      data: Buffer.from(options.data),
      contentType: options.contentType,
    });
    return {
      key: options.key,
      url: `/api/images/${options.key}`,
      contentType: options.contentType,
      size: options.data.byteLength,
    };
  }

  async get(key: string) {
    const value = store.get(key);
    if (!value) return null;
    return { data: Buffer.from(value.data), contentType: value.contentType };
  }

  async delete(key: string) {
    store.delete(key);
  }
}

export function clearMemoryStorage() {
  store.clear();
}
