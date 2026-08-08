import { nanoid } from "nanoid";
import { getProviderManager } from "@/lib/ai/provider-manager";
import type { GenerateRequest } from "@/lib/generation/validation";
import { getGenerationRepository } from "@/lib/db";
import { AppError, toAppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { getImageStorage } from "@/lib/storage";

function extensionFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export async function createGeneration(options: {
  userId: string;
  request: GenerateRequest;
  requestId: string;
}) {
  const repo = getGenerationRepository();
  const storage = getImageStorage();
  const providers = getProviderManager();
  const generationId = nanoid(16);
  const started = Date.now();

  await repo.create({
    id: generationId,
    userId: options.userId,
    prompt: options.request.prompt,
    negativePrompt: options.request.negativePrompt,
    width: options.request.width,
    height: options.request.height,
    aspectRatio: options.request.aspectRatio,
    style: options.request.style,
    seed: options.request.seed,
    status: "processing",
  });

  try {
    const result = await providers.generate(
      {
        prompt: options.request.prompt,
        negativePrompt: options.request.negativePrompt,
        width: options.request.width,
        height: options.request.height,
        aspectRatio: options.request.aspectRatio,
        style: options.request.style,
        model: options.request.model,
        seed: options.request.seed,
      },
      { requestId: options.requestId, generationId },
    );

    let imageBytes = result.imageBytes;
    if (!imageBytes && result.imageUrl) {
      // Only fetch from the provider-returned URL, never from user input.
      const imageResponse = await fetch(result.imageUrl);
      if (!imageResponse.ok) {
        throw new AppError("GENERATION_FAILED");
      }
      imageBytes = Buffer.from(await imageResponse.arrayBuffer());
    }
    if (!imageBytes) {
      throw new AppError("GENERATION_FAILED");
    }

    const contentType = result.contentType ?? "image/jpeg";
    const ext = extensionFor(contentType);
    const date = new Date().toISOString().slice(0, 10);
    const storageKey = `generations/${options.userId}/${date}/${generationId}.${ext}`;

    const stored = await storage.put({
      key: storageKey,
      data: imageBytes,
      contentType,
    });

    const completed = await repo.update(generationId, {
      status: "completed",
      provider: result.provider,
      model: result.model ?? null,
      imageUrl: stored.url,
      storageKey: stored.key,
      thumbnailUrl: stored.url,
      seed: result.seed ?? options.request.seed ?? null,
      completedAt: new Date().toISOString(),
      errorCode: null,
    });

    logger.info("generation_completed", {
      requestId: options.requestId,
      generationId,
      provider: result.provider,
      model: result.model,
      durationMs: Date.now() - started,
      status: "completed",
    });

    return completed!;
  } catch (error) {
    const appError = toAppError(error);
    await repo.update(generationId, {
      status: "failed",
      errorCode: appError.code,
      completedAt: new Date().toISOString(),
    });
    logger.error("generation_failed", {
      requestId: options.requestId,
      generationId,
      errorCategory: appError.code,
      durationMs: Date.now() - started,
      status: "failed",
    });
    throw appError;
  }
}

export async function getGenerationForUser(id: string, userId: string) {
  const record = await getGenerationRepository().findById(id);
  if (!record) {
    throw new AppError("NOT_FOUND");
  }
  if (record.userId !== userId) {
    throw new AppError("FORBIDDEN");
  }
  return record;
}

export async function listGenerationsForUser(
  userId: string,
  options?: { limit?: number; offset?: number },
) {
  return getGenerationRepository().listByUser(userId, options);
}

/** Public DTO — never include secrets or raw provider payloads. */
export function toPublicGeneration(record: {
  id: string;
  prompt: string;
  negativePrompt: string | null;
  provider: string | null;
  model: string | null;
  width: number;
  height: number;
  aspectRatio: string | null;
  style: string | null;
  seed: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}) {
  return {
    id: record.id,
    prompt: record.prompt,
    negativePrompt: record.negativePrompt,
    provider: record.provider,
    model: record.model,
    width: record.width,
    height: record.height,
    aspectRatio: record.aspectRatio,
    style: record.style,
    seed: record.seed,
    imageUrl: record.imageUrl,
    thumbnailUrl: record.thumbnailUrl ?? record.imageUrl,
    status: record.status,
    errorCode: record.errorCode,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
  };
}
