type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  generationId?: string;
  provider?: string;
  model?: string;
  durationMs?: number;
  status?: string;
  errorCategory?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  "api_key",
  "apiKey",
  "token",
  "password",
  "secret",
  "authorization",
  "cookie",
  "hf_token",
  "pollinations_api_key",
];

function sanitizeContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: sanitizeContext(context) } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
