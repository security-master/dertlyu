import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors/app-error";
import { getEnv } from "@/lib/config/env";
import type { ImageStorage, StoredObject } from "./types";

function assertSafeKey(key: string) {
  if (
    !key ||
    key.includes("..") ||
    key.includes("\\") ||
    path.isAbsolute(key) ||
    key.startsWith("/")
  ) {
    throw new AppError("INVALID_REQUEST", {
      message: "Invalid storage key.",
    });
  }
}

export class LocalStorage implements ImageStorage {
  readonly name = "local";

  private root() {
    // Keep the resolved root under a fixed project subfolder for bundler tracing.
    const configured = getEnv().storage.localDir.replace(/^(\.\/)+/, "");
    const safe = configured.startsWith(".data/")
      ? configured
      : path.join(".data", "images");
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), safe);
  }

  async put(options: {
    key: string;
    data: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    assertSafeKey(options.key);
    const full = path.join(this.root(), options.key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, options.data);
    return {
      key: options.key,
      url: `/api/images/${options.key}`,
      contentType: options.contentType,
      size: options.data.byteLength,
    };
  }

  async get(key: string) {
    assertSafeKey(key);
    try {
      const data = await readFile(path.join(this.root(), key));
      const ext = path.extname(key).toLowerCase();
      const contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      return { data, contentType };
    } catch {
      return null;
    }
  }
}
