export type AppErrorCode =
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_QUOTA_EXCEEDED"
  | "GENERATION_FAILED"
  | "STORAGE_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "CONTENT_BLOCKED";

const USER_MESSAGES: Record<AppErrorCode, string> = {
  INVALID_REQUEST: "Please check your request and try again.",
  RATE_LIMITED: "You're generating too quickly. Please wait a moment and try again.",
  PROVIDER_UNAVAILABLE:
    "Image generation is temporarily unavailable. Please try again shortly.",
  PROVIDER_TIMEOUT: "Image generation timed out. Please try again.",
  PROVIDER_QUOTA_EXCEEDED:
    "The image service is at capacity. Please try again later.",
  GENERATION_FAILED: "We couldn't generate that image. Please try a different prompt.",
  STORAGE_FAILED: "The image was generated but could not be saved. Please try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have access to this resource.",
  NOT_FOUND: "That generation could not be found.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  CONTENT_BLOCKED:
    "This prompt couldn't be processed. Please revise it and try again.",
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    options?: {
      message?: string;
      status?: number;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(options?.message ?? USER_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? statusForCode(code);
    this.details = options?.details;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }

  toJSON() {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

function statusForCode(code: AppErrorCode): number {
  switch (code) {
    case "INVALID_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
    case "PROVIDER_QUOTA_EXCEEDED":
      return 429;
    case "CONTENT_BLOCKED":
      return 422;
    case "PROVIDER_TIMEOUT":
      return 504;
    case "PROVIDER_UNAVAILABLE":
    case "GENERATION_FAILED":
    case "STORAGE_FAILED":
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError("INTERNAL_ERROR", { cause: error });
}
