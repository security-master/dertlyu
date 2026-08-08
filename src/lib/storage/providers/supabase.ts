import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/config/env";
import type { ImageStorage, ImageStorageResult, StorageUploadOptions } from "../types";

export class SupabaseStorageProvider implements ImageStorage {
  readonly name = "supabase";
  private client: SupabaseClient | null = null;
  private bucket = "generations";
  private publicUrl: string;

  constructor() {
    const env = getEnv();
    this.publicUrl = env.STORAGE_PUBLIC_URL ?? env.NEXT_PUBLIC_APP_URL;

    if (this.isAvailable()) {
      const url = env.SUPABASE_URL!;
      const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY!;
      this.client = createClient(url, key);
    }
  }

  isAvailable(): boolean {
    const env = getEnv();
    return Boolean(
      env.SUPABASE_URL &&
        (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)
    );
  }

  async upload(options: StorageUploadOptions): Promise<ImageStorageResult> {
    if (!this.client) {
      throw new Error("Supabase storage is not configured");
    }

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(options.key, options.data, {
        contentType: options.contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(options.key);

    return {
      key: options.key,
      url: data.publicUrl || this.getPublicUrl(options.key),
      contentType: options.contentType,
      size: options.data.length,
    };
  }

  getPublicUrl(key: string): string {
    const env = getEnv();
    if (env.SUPABASE_URL) {
      return `${env.SUPABASE_URL}/storage/v1/object/public/${this.bucket}/${key}`;
    }
    return `${this.publicUrl}/api/images/${key}`;
  }
}
