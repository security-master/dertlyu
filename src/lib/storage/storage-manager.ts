import { getEnv } from "@/lib/config/env";
import { isServerlessEnvironment } from "@/lib/storage/image-cache";
import { AppError } from "@/lib/errors/app-error";
import { LocalStorageProvider } from "./providers/local";
import { MemoryStorageProvider } from "./providers/memory";
import { S3StorageProvider } from "./providers/s3";
import { SupabaseStorageProvider } from "./providers/supabase";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "./types";

export class StorageManager {
  private provider: ImageStorage;

  constructor() {
    const env = getEnv();
    const publicUrl = env.STORAGE_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL;
    const providers: ImageStorage[] = [];

    try {
      providers.push(new MemoryStorageProvider(publicUrl));
    } catch {
      // Memory storage should always be available
    }

    try {
      providers.push(new LocalStorageProvider());
    } catch {
      // Local disk optional
    }

    try {
      const s3 = new S3StorageProvider();
      if (s3.isAvailable()) providers.push(s3);
    } catch {
      // S3 not configured
    }

    try {
      const supabase = new SupabaseStorageProvider();
      if (supabase.isAvailable()) providers.push(supabase);
    } catch {
      // Supabase not configured
    }

    const preferredName =
      isServerlessEnvironment() && env.STORAGE_PROVIDER === "local"
        ? "memory"
        : env.STORAGE_PROVIDER;

    const preferred = providers.find((p) => p.name === preferredName);

    if (preferred?.isAvailable()) {
      this.provider = preferred;
      return;
    }

    // On Vercel/serverless: memory first (no disk writes required)
    if (isServerlessEnvironment()) {
      const memory = providers.find((p) => p.name === "memory");
      if (memory) {
        this.provider = memory;
        return;
      }
    }

    const available = providers.find((p) => p.isAvailable());
    this.provider = available ?? new MemoryStorageProvider(publicUrl);
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
    try {
      return await this.provider.upload(options);
    } catch (error) {
      throw new AppError(
        "STORAGE_FAILED",
        error instanceof Error ? error.message : undefined
      );
    }
  }

  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}

let storageInstance: StorageManager | null = null;

export function getStorageManager(): StorageManager {
  if (!storageInstance) {
    storageInstance = new StorageManager();
  }
  return storageInstance;
}

export function buildStorageKey(generationId: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `generations/${date}/${generationId}.${extension}`;
}
