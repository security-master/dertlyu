import { NextResponse } from "next/server";
import { AppError, isAppError } from "@/lib/errors/app-error";

export function errorResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  const appError = new AppError("INTERNAL_ERROR");
  return NextResponse.json(appError.toJSON(), { status: 500 });
}

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
