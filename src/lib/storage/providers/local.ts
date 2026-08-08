import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { getEnv } from "@/lib/config/env";
import { isServerlessEnvironment, putImage } from "../image-cache";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "../types";

export function resolveLocalStoragePath(): string {
  const env = getEnv();
  const configured = env.STORAGE_LOCAL_PATH;

  if (isServerlessEnvironment()) {
    return join(tmpdir(), "dertlyu-storage");
  }

  if (configured.startsWith("/")) {
    return configured;
  }

  return resolve(process.cwd(), configured);
}

export class LocalStorageProvider implements ImageStorage {
  readonly name = "local";
  private basePath: string;
  private publicUrl: string;

  constructor() {
    const env = getEnv();
    this.basePath = resolveLocalStoragePath();
    this.publicUrl = env.STORAGE_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL;
  }

  isAvailable(): boolean {
    return true;
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
    const filePath = join(this.basePath, options.key);

    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, options.data);
    } catch (error) {
      // Serverless fallback: keep image in memory cache if disk write fails
      if (isServerlessEnvironment()) {
        putImage(options.key, options.data, options.contentType);
      } else {
        throw error;
      }
    }

    // Always cache in memory for fast reads (especially on serverless)
    putImage(options.key, options.data, options.contentType);

    return {
      key: options.key,
      url: this.getPublicUrl(options.key),
      contentType: options.contentType,
      size: options.data.length,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/api/images/${key}`;
  }
}
