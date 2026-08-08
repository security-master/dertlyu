import { getProviderManager } from "@/lib/ai/provider-manager";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger";
import { getGenerationRepository } from "@/lib/repositories";
import type { GenerationData } from "@/lib/repositories/generation-repository";
import {
  buildStorageKey,
  getStorageManager,
} from "@/lib/storage/storage-manager";
import {
  putGenerationImage,
  getGenerationImage,
  toDataUrl,
} from "@/lib/storage/generation-image-store";
import { getImageExtension } from "@/lib/utils";
import type { GenerateRequestInput } from "@/lib/validation/generate";
import { validatePromptSafety } from "@/lib/validation/generate";
import type { GenerateApiResponse } from "@/types/generation";

export class GenerationService {
  async generate(
    input: GenerateRequestInput,
    userId: string | null,
    requestId: string
  ): Promise<GenerateApiResponse> {
    if (!validatePromptSafety(input.prompt)) {
      throw new AppError("INVALID_REQUEST", "This prompt cannot be processed.");
    }

    const repository = getGenerationRepository();
    const providerManager = getProviderManager();
    const storageManager = getStorageManager();

    const record = await repository.create({
      userId,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      width: input.width,
      height: input.height,
      aspectRatio: input.aspectRatio,
      style: input.style,
      seed: input.seed,
      status: "processing",
    });

    logger.info("Generation started", {
      requestId,
      generationId: record.id,
      status: "processing",
    });

    try {
      const styledPrompt = input.style
        ? `${input.style} style: ${input.prompt}`
        : input.prompt;

      const result = await providerManager.generate(
        {
          prompt: styledPrompt,
          negativePrompt: input.negativePrompt,
          width: input.width,
          height: input.height,
          aspectRatio: input.aspectRatio,
          seed: input.seed,
          model: input.model,
          style: input.style,
        },
        requestId
      );

      const extension = getImageExtension(result.contentType);
      const storageKey = buildStorageKey(record.id, extension);

      await storageManager.upload({
        key: storageKey,
        data: result.imageData,
        contentType: result.contentType,
      });

      putGenerationImage(record.id, result.imageData, result.contentType);

      const imageUrl = `/api/generations/${record.id}/image`;

      const updated = await repository.update(record.id, {
        provider: result.provider,
        model: result.model,
        imageUrl,
        storageKey: storageKey,
        status: "completed",
        completedAt: new Date(),
      });

      logger.info("Generation completed", {
        requestId,
        generationId: record.id,
        provider: result.provider,
        model: result.model,
        status: "completed",
      });

      return this.toApiResponse(updated);
    } catch (error) {
      const errorCode =
        error instanceof AppError ? error.code : "GENERATION_FAILED";

      await repository.update(record.id, {
        status: "failed",
        errorCode,
        completedAt: new Date(),
      });

      logger.error("Generation failed", {
        requestId,
        generationId: record.id,
        errorCategory: errorCode,
        status: "failed",
      });

      throw error;
    }
  }

  async getById(id: string, userId: string | null): Promise<GenerationData> {
    const repository = getGenerationRepository();
    const record = await repository.findById(id);

    if (!record) {
      throw new AppError("NOT_FOUND");
    }

    if (record.userId && record.userId !== userId) {
      throw new AppError("FORBIDDEN");
    }

    return record;
  }

  async listForUser(userId: string | null, limit = 50): Promise<GenerationData[]> {
    const repository = getGenerationRepository();

    if (userId) {
      return repository.findByUserId(userId, limit);
    }

    return repository.findRecent(limit);
  }

  toApiResponse(record: GenerationData): GenerateApiResponse {
    const cached = getGenerationImage(record.id);
    const imageUrl = `/api/generations/${record.id}/image`;
    const imageDataUrl = cached
      ? toDataUrl(cached.data, cached.contentType)
      : null;

    return {
      success: true,
      generation: {
        id: record.id,
        status: record.status,
        imageUrl,
        imageDataUrl,
        prompt: record.prompt,
        width: record.width,
        height: record.height,
        aspectRatio: record.aspectRatio,
        style: record.style,
        model: record.model,
        provider: record.provider,
        createdAt: record.createdAt.toISOString(),
        completedAt: record.completedAt?.toISOString() ?? null,
      },
    };
  }
}

let serviceInstance: GenerationService | null = null;

export function getGenerationService(): GenerationService {
  if (!serviceInstance) {
    serviceInstance = new GenerationService();
  }
  return serviceInstance;
}
