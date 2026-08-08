import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { LocalStorageProvider } from "./providers/local";
import { S3StorageProvider } from "./providers/s3";
import { SupabaseStorageProvider } from "./providers/supabase";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "./types";

export class StorageManager {
  private provider: ImageStorage;

  constructor() {
    const env = getEnv();
    const providers: ImageStorage[] = [];

    try {
      providers.push(new LocalStorageProvider());
    } catch {
      // Local storage should always be available
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

    const preferred = providers.find((p) => p.name === env.STORAGE_PROVIDER);
    const available = providers.find((p) => p.isAvailable());

    this.provider =
      preferred?.isAvailable()
        ? preferred
        : available ?? new LocalStorageProvider();
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
