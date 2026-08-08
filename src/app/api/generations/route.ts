import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { getGenerationService } from "@/services/generation-service";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getAuthUser(authHeader);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);

    const service = getGenerationService();
    const generations = await service.listForUser(user?.id ?? null, limit);

    return jsonResponse({
      success: true,
      generations: generations.map((g) => ({
        id: g.id,
        status: g.status,
        imageUrl: g.imageUrl,
        prompt: g.prompt,
        width: g.width,
        height: g.height,
        aspectRatio: g.aspectRatio,
        style: g.style,
        model: g.model,
        provider: g.provider,
        createdAt: g.createdAt.toISOString(),
        completedAt: g.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
