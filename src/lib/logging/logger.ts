type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const SENSITIVE_KEY =
  /(api[_-]?key|secret|token|password|authorization|cookie|private[_-]?key|credential)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(nested, depth + 1);
  }
  return out;
}

function write(level: LogLevel, message: string, fields?: LogFields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(fields ? (sanitize(fields) as LogFields) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
