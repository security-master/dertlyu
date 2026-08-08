import { readFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse } from "@/lib/api/response";

const SAFE_KEY_PATTERN = /^[a-zA-Z0-9/_\-.]+$/;

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

    const env = getEnv();
    const filePath = join(env.STORAGE_LOCAL_PATH, key);

    const data = await readFile(filePath);

    const extension = key.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "png"
        ? "image/png"
        : extension === "jpg" || extension === "jpeg"
          ? "image/jpeg"
          : extension === "webp"
            ? "image/webp"
            : "application/octet-stream";

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
