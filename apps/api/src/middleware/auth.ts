import { ApiError } from "@mediamedicine/shared/errors";
import { createMiddleware } from "hono/factory";
import * as jose from "jose";
import type { AppVariables, Env } from "../env";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/v1/health",
  "/v1/openapi.json",
  "/v1/auth/signup",
  "/v1/auth/login",
  "/v1/auth/refresh",
  "/v1/specialties",
  "/v1/link-preview",
];

function isPublicPath(path: string): boolean {
  if (path === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((p) => p !== "/" && (path === p || path.startsWith(`${p}/`)));
}

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (isPublicPath(path)) {
      await next();
      return;
    }

    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new ApiError("unauthorized", "Missing or invalid Authorization header", 401);
    }

    const token = header.slice(7);
    try {
      const secret = new TextEncoder().encode(c.env.SUPABASE_JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      const sub = payload.sub;
      if (!sub || typeof sub !== "string") {
        throw new ApiError("unauthorized", "Invalid token subject", 401);
      }
      c.set("userId", sub);
      c.set("accessToken", token);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("unauthorized", "Invalid or expired token", 401);
    }

    await next();
  },
);
