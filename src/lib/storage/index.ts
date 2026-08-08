import { getEnv } from "@/lib/config/env";
import { BlobsStorage } from "./blobs";
import { LocalStorage } from "./local";
import { MemoryStorage } from "./memory";
import { R2Storage } from "./r2";
import type { ImageStorage } from "./types";

let singleton: ImageStorage | null = null;

export function getImageStorage(): ImageStorage {
  if (singleton) return singleton;
  const provider = getEnv().storage.provider;
  switch (provider) {
    case "memory":
      singleton = new MemoryStorage();
      break;
    case "blobs":
      singleton = new BlobsStorage();
      break;
    case "r2":
      singleton = new R2Storage();
      break;
    case "local":
    default:
      singleton = new LocalStorage();
      break;
  }
  return singleton;
}

export function setImageStorageForTests(storage: ImageStorage | null) {
  singleton = storage;
}

export type { ImageStorage, StoredObject } from "./types";
