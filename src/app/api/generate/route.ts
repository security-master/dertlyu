import { NextRequest } from "next/server";
import { getAuthUser, getClientIdentifier } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { generateRequestId, logger } from "@/lib/logger";
import { getRateLimiter, getRateLimitForUser } from "@/lib/rate-limit";
import { generateRequestSchema } from "@/lib/validation/generate";
import { getGenerationService } from "@/services/generation-service";

const MAX_BODY_SIZE = 10 * 1024;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      throw new AppError("INVALID_REQUEST", "Request body is too large.");
    }

    const body = await request.json();
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const authHeader = request.headers.get("authorization");
    const user = await getAuthUser(authHeader);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip");

    const identifier = getClientIdentifier(user, ip);
    const limit = getRateLimitForUser(Boolean(user));
    const rateLimiter = getRateLimiter();
    const rateResult = await rateLimiter.check(identifier, limit);

    if (!rateResult.success) {
      throw new AppError("RATE_LIMITED");
    }

    const service = getGenerationService();
    const result = await service.generate(
      parsed.data,
      user?.id ?? null,
      requestId
    );

    return jsonResponse(result, 201);
  } catch (error) {
    logger.error("Generate API error", {
      requestId,
      errorCategory: error instanceof AppError ? error.code : "INTERNAL_ERROR",
    });
    return errorResponse(error);
  }
}
