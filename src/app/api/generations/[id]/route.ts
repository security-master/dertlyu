import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { getGenerationService } from "@/services/generation-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const user = await getAuthUser(authHeader);

    const service = getGenerationService();
    const generation = await service.getById(id, user?.id ?? null);

    return jsonResponse({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        imageUrl: generation.imageUrl,
        prompt: generation.prompt,
        negativePrompt: generation.negativePrompt,
        width: generation.width,
        height: generation.height,
        aspectRatio: generation.aspectRatio,
        style: generation.style,
        model: generation.model,
        provider: generation.provider,
        seed: generation.seed,
        createdAt: generation.createdAt.toISOString(),
        completedAt: generation.completedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
