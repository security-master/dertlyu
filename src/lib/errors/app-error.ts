export type AppErrorCode =
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_QUOTA_EXCEEDED"
  | "GENERATION_FAILED"
  | "STORAGE_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  INVALID_REQUEST: "The request was invalid. Please check your input and try again.",
  RATE_LIMITED: "You have reached the generation limit. Please try again later.",
  PROVIDER_UNAVAILABLE:
    "Görüntü servisi geçici olarak kullanılamıyor. Lütfen biraz sonra tekrar deneyin.",
  PROVIDER_NOT_CONFIGURED:
    "Görüntü üretimi yapılandırılmamış. Sunucuda POLLINATIONS_API_KEY veya HF_TOKEN ayarlanmalı.",
  PROVIDER_TIMEOUT:
    "Image generation took too long. Please try again with a simpler prompt.",
  PROVIDER_QUOTA_EXCEEDED:
    "The image service quota has been exceeded. Please try again later.",
  GENERATION_FAILED: "Image generation failed. Please try again.",
  STORAGE_FAILED: "Failed to store the generated image. Please try again.",
  UNAUTHORIZED: "You must be signed in to perform this action.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message?: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode ?? getDefaultStatusCode(code);
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

function getDefaultStatusCode(code: AppErrorCode): number {
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
    case "PROVIDER_TIMEOUT":
      return 504;
    case "PROVIDER_NOT_CONFIGURED":
      return 503;
    case "PROVIDER_UNAVAILABLE":
    case "GENERATION_FAILED":
    case "STORAGE_FAILED":
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 500;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
