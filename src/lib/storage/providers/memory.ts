import { putImage } from "../image-cache";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "../types";

export class MemoryStorageProvider implements ImageStorage {
  readonly name = "memory";
  private publicUrl: string;

  constructor(publicUrl: string) {
    this.publicUrl = publicUrl;
  }

  isAvailable(): boolean {
    return true;
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
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
