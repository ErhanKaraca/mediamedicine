import { ApiError } from "@mediamedicine/shared/errors";
import { createMiddleware } from "hono/factory";
import type { AppVariables, Env } from "../env";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  "/v1/auth/login": { limit: 10, windowSeconds: 60 },
  "/v1/auth/signup": { limit: 5, windowSeconds: 60 },
  "/v1/auth/refresh": { limit: 30, windowSeconds: 60 },
};

const DEFAULT_LIMIT: RateLimitConfig = { limit: 120, windowSeconds: 60 };
const WRITE_LIMIT: RateLimitConfig = { limit: 60, windowSeconds: 60 };

function getLimit(path: string, method: string): RateLimitConfig {
  if (ROUTE_LIMITS[path]) return ROUTE_LIMITS[path]!;
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") return WRITE_LIMIT;
  return DEFAULT_LIMIT;
}

export const rateLimitMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const path = new URL(c.req.url).pathname;
    const config = getLimit(path, c.req.method);
    const userId = c.get("userId");
    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const key = userId ? `user:${userId}:${path}` : `ip:${ip}:${path}`;

    const id = c.env.RATE_LIMITER.idFromName(key);
    const stub = c.env.RATE_LIMITER.get(id);
    const res = await stub.fetch("https://rate-limiter/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: config.limit, windowSeconds: config.windowSeconds }),
    });

    const result = (await res.json()) as { allowed: boolean; remaining: number; resetAt: number };
    c.header("X-RateLimit-Limit", String(config.limit));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      throw new ApiError("rate_limited", "Too many requests", 429);
    }

    await next();
  },
);
