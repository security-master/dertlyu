import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { getEnv } from "@/lib/config/env";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "../types";

export class LocalStorageProvider implements ImageStorage {
  readonly name = "local";
  private basePath: string;
  private publicUrl: string;

  constructor() {
    const env = getEnv();
    this.basePath = env.STORAGE_LOCAL_PATH;
    this.publicUrl = env.STORAGE_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL;
  }

  isAvailable(): boolean {
    return true;
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
    const filePath = join(this.basePath, options.key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, options.data);

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
