import { getStore } from "@netlify/blobs";
import { AppError } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/config/env";
import { logger } from "@/lib/logging/logger";
import type { ImageStorage, StoredObject } from "./types";

function toArrayBuffer(data: Buffer): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
}

export class BlobsStorage implements ImageStorage {
  readonly name = "blobs";

  private store() {
    return getStore({
      name: getEnv().storage.blobsStore,
      consistency: "strong",
    });
  }

  async put(options: {
    key: string;
    data: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    try {
      await this.store().set(options.key, toArrayBuffer(options.data), {
        metadata: { contentType: options.contentType },
      });
      return {
        key: options.key,
        url: `/api/images/${options.key}`,
        contentType: options.contentType,
        size: options.data.byteLength,
      };
    } catch (error) {
      logger.error("blobs_put_failed", { errorCategory: "storage" });
      throw new AppError("STORAGE_FAILED", { cause: error });
    }
  }

  async get(key: string) {
    try {
      const result = await this.store().getWithMetadata(key, {
        type: "arrayBuffer",
      });
      if (!result) return null;
      const contentType =
        (result.metadata?.contentType as string | undefined) ?? "image/jpeg";
      return { data: Buffer.from(result.data as ArrayBuffer), contentType };
    } catch {
      logger.warn("blobs_get_failed", { errorCategory: "storage" });
      return null;
    }
  }
}
