import { NextRequest, NextResponse } from "next/server";
import { getGenerationImage } from "@/lib/storage/generation-image-store";
import { getImage } from "@/lib/storage/image-cache";
import { readFile } from "fs/promises";
import { join } from "path";
import { resolveLocalStoragePath } from "@/lib/storage/providers/local";
import { getGenerationService } from "@/services/generation-service";
import { getAuthUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse } from "@/lib/api/response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = _request.headers.get("authorization");
    const user = await getAuthUser(authHeader);

    const service = getGenerationService();
    const generation = await service.getById(id, user?.id ?? null);

    const cached = getGenerationImage(id);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.data), {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (generation.storageKey) {
      const fromCache = getImage(generation.storageKey);
      if (fromCache) {
        return new NextResponse(new Uint8Array(fromCache.data), {
          headers: {
            "Content-Type": fromCache.contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      try {
        const basePath = resolveLocalStoragePath();
        const filePath = join(basePath, generation.storageKey);
        const data = await readFile(filePath);
        const extension = generation.storageKey.split(".").pop()?.toLowerCase();
        const contentType =
          extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : "image/jpeg";

        return new NextResponse(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400",
          },
        });
      } catch {
        // fall through to 404
      }
    }

    return errorResponse(new AppError("NOT_FOUND"));
  } catch (error) {
    return errorResponse(error);
  }
}
