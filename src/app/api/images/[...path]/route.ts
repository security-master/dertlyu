import { readFile } from "fs/promises";
import { join } from "path";
import { getImage } from "@/lib/storage/image-cache";
import { resolveLocalStoragePath } from "@/lib/storage/providers/local";
import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse } from "@/lib/api/response";

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9/_\-.]+$/;

function contentTypeFromKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const key = pathSegments.join("/");

    if (!key || !SAFE_KEY_PATTERN.test(key) || key.includes("..")) {
      throw new AppError("INVALID_REQUEST", "Invalid image path.");
    }

    const cached = getImage(key);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.data), {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const basePath = resolveLocalStoragePath();
    const filePath = join(basePath, key);
    const data = await readFile(filePath);
    const contentType = contentTypeFromKey(key);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return errorResponse(new AppError("NOT_FOUND"));
    }
    return errorResponse(error);
  }
}
