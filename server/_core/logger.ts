/**
 * Structured logger for server-side code.
 *
 * In production (NODE_ENV=production):
 *   - Only "warn" and "error" levels are emitted.
 *   - Output is JSON-formatted for log aggregators.
 *
 * In development:
 *   - All levels are emitted with human-readable formatting.
 *   - Sensitive data is never printed (see rules below).
 *
 * Rules:
 *   - NEVER log raw request bodies containing payment card data.
 *   - NEVER log JWT tokens, session cookies, or API keys.
 *   - Payment amounts and booking IDs are acceptable at INFO level.
 *   - User PII (CPF, full name, e-mail) must NOT appear in logs.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = IS_PRODUCTION ? "warn" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function format(level: LogLevel, message: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;

  if (IS_PRODUCTION) {
    // JSON output for log aggregators (Datadog, CloudWatch, etc.)
    const entry = {
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...(args.length > 0 ? { extra: args } : {}),
    };
    if (level === "error") {
      process.stderr.write(JSON.stringify(entry) + "\n");
    } else {
      process.stdout.write(JSON.stringify(entry) + "\n");
    }
  } else {
    // Human-readable for development
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const prefix = `[${ts}] [${level.toUpperCase().padEnd(5)}]`;
    if (level === "error") {
      console.error(prefix, message, ...args);
    } else if (level === "warn") {
      console.warn(prefix, message, ...args);
    } else {
      console.log(prefix, message, ...args);
    }
  }
}

const logger = {
  debug: (message: string, ...args: unknown[]) => format("debug", message, ...args),
  info:  (message: string, ...args: unknown[]) => format("info",  message, ...args),
  warn:  (message: string, ...args: unknown[]) => format("warn",  message, ...args),
  error: (message: string, ...args: unknown[]) => format("error", message, ...args),
};

export default logger;
