import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { AppError } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/logging/logger";
import type { ImageStorage, StoredObject } from "./types";

export class R2Storage implements ImageStorage {
  readonly name = "r2";
  private clientInstance: S3Client | null = null;

  private config() {
    const r2 = getEnv().storage.r2;
    if (
      !r2.accountId ||
      !r2.accessKeyId ||
      !r2.secretAccessKey ||
      !r2.bucket ||
      !r2.publicUrl
    ) {
      throw new AppError("STORAGE_FAILED", {
        message: "R2 storage is not fully configured.",
      });
    }
    return r2;
  }

  private client() {
    if (this.clientInstance) return this.clientInstance;
    const r2 = this.config();
    const endpoint =
      r2.endpoint ?? `https://${r2.accountId}.r2.cloudflarestorage.com`;
    this.clientInstance = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: r2.accessKeyId!,
        secretAccessKey: r2.secretAccessKey!,
      },
    });
    return this.clientInstance;
  }

  async put(options: {
    key: string;
    data: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    const r2 = this.config();
    try {
      await this.client().send(
        new PutObjectCommand({
          Bucket: r2.bucket!,
          Key: options.key,
          Body: options.data,
          ContentType: options.contentType,
        }),
      );
      const base = r2.publicUrl!.replace(/\/$/, "");
      return {
        key: options.key,
        url: `${base}/${options.key}`,
        contentType: options.contentType,
        size: options.data.byteLength,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("r2_put_failed", { errorCategory: "storage" });
      throw new AppError("STORAGE_FAILED", { cause: error });
    }
  }

  async get(key: string) {
    const r2 = this.config();
    try {
      const result = await this.client().send(
        new GetObjectCommand({ Bucket: r2.bucket!, Key: key }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        data: Buffer.from(bytes),
        contentType: result.ContentType ?? "image/jpeg",
      };
    } catch {
      return null;
    }
  }
}
