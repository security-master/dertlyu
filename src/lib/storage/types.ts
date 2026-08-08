export interface ImageStorageResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface StorageUploadOptions {
  key: string;
  data: Buffer;
  contentType: string;
}

export interface ImageStorage {
  readonly name: string;

  isAvailable(): boolean;

  upload(options: StorageUploadOptions): Promise<ImageStorageResult>;

  getPublicUrl(key: string): string;
}
