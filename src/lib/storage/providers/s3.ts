import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getEnv } from "@/lib/config/env";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "../types";

export class S3StorageProvider implements ImageStorage {
  readonly name = "s3";
  private client: S3Client | null;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    const env = getEnv();

    this.bucket = env.R2_BUCKET ?? env.S3_BUCKET ?? "";
    this.publicUrl = env.R2_PUBLIC_URL ?? env.S3_PUBLIC_URL ?? "";

    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID ?? env.S3_ACCESS_KEY_ID;
    const secretAccessKey =
      env.R2_SECRET_ACCESS_KEY ?? env.S3_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey || !this.bucket) {
      this.client = null;
      return;
    }

    const endpoint =
      env.S3_ENDPOINT ??
      (accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined);

    this.client = new S3Client({
      region: env.S3_REGION ?? "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  isAvailable(): boolean {
    const env = getEnv();
    const hasR2 =
      env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET;
    const hasS3 =
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_BUCKET;
    return Boolean(hasR2 || hasS3);
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
    if (!this.client) {
      throw new Error("S3 storage is not configured");
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: options.data,
        ContentType: options.contentType,
      })
    );

    return {
      key: options.key,
      url: this.getPublicUrl(options.key),
      contentType: options.contentType,
      size: options.data.length,
    };
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
    }
    return `/api/images/${key}`;
  }
}
