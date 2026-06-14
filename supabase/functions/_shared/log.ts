// Minimal structured JSON logger shared across Edge Functions. Output is picked
// up by Supabase log drains; keep one JSON object per line.
type Level = "debug" | "info" | "warn" | "error";

export interface LogContext {
  fn: string;
  requestId?: string;
  [key: string]: unknown;
}

function emit(level: Level, ctx: LogContext, message: string, extra?: unknown) {
  const entry = {
    level,
    ts: new Date().toISOString(),
    message,
    ...ctx,
    ...(extra !== undefined ? { extra } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(ctx: LogContext) {
  return {
    debug: (msg: string, extra?: unknown) => emit("debug", ctx, msg, extra),
    info: (msg: string, extra?: unknown) => emit("info", ctx, msg, extra),
    warn: (msg: string, extra?: unknown) => emit("warn", ctx, msg, extra),
    error: (msg: string, extra?: unknown) => emit("error", ctx, msg, extra),
  };
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}
