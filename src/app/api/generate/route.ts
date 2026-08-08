import { nanoid } from "nanoid";
import { requireUser } from "@/lib/auth/session";
import { AppError, toAppError } from "@/lib/errors/app-error";
import {
  createGeneration,
  toPublicGeneration,
} from "@/lib/generation/service";
import {
  generateRequestSchema,
  MAX_BODY_BYTES,
} from "@/lib/generation/validation";
import { logger } from "@/lib/logging/logger";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? nanoid(12);

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      throw new AppError("INVALID_REQUEST", {
        message: "Request body is too large.",
      });
    }

    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      throw new AppError("INVALID_REQUEST", {
        message: "Request body is too large.",
      });
    }

    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new AppError("INVALID_REQUEST", {
        message: "Malformed JSON body.",
      });
    }

    const parsed = generateRequestSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("INVALID_REQUEST", {
        message: parsed.error.issues[0]?.message ?? "Invalid request.",
      });
    }

    const user = await requireUser();
    const rate = await enforceRateLimit({
      userId: user.id,
      isAuthenticated: user.isAuthenticated,
    });

    const generation = await createGeneration({
      userId: user.id,
      request: parsed.data,
      requestId,
    });

    return Response.json(
      {
        success: true,
        data: toPublicGeneration(generation),
      },
      {
        status: 201,
        headers: {
          "X-Request-Id": requestId,
          "X-RateLimit-Remaining": String(rate.remaining),
        },
      },
    );
  } catch (error) {
    const appError = toAppError(error);
    logger.error("generate_api_error", {
      requestId,
      errorCategory: appError.code,
    });
    return Response.json(appError.toJSON(), {
      status: appError.status,
      headers: { "X-Request-Id": requestId },
    });
  }
}
