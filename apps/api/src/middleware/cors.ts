import { createMiddleware } from "hono/factory";
import type { Env } from "../env";

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const corsMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const origin = c.req.header("Origin") ?? "";
  const allowed = parseOrigins(c.env.CORS_ORIGINS);
  const isDev = c.env.ENVIRONMENT === "development";
  const allowOrigin =
    isDev && allowed.length === 0
      ? "*"
      : allowed.includes(origin)
        ? origin
        : allowed[0] ?? "";

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, X-Request-Id, Idempotency-Key, X-Use-Refresh-Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  await next();

  if (allowOrigin) {
    c.header("Access-Control-Allow-Origin", allowOrigin);
  }
  c.header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-Id, Idempotency-Key, X-Use-Refresh-Cookie");
  c.header("Access-Control-Allow-Credentials", "true");
});
