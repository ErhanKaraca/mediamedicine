import { ApiError } from "@mediamedicine/shared/errors";
import { createMiddleware } from "hono/factory";
import type { AppVariables, Env } from "../env";
import { verifyAccessToken } from "../lib/jwt-verify";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/v1/health",
  "/v1/openapi.json",
  "/v1/docs",
  "/v1/swagger",
  "/v1/auth/otp/send",
  "/v1/auth/otp/verify",
  "/v1/auth/refresh",
  "/v1/auth/oauth",
  "/v1/auth/callback",
  "/v1/specialties",
  "/v1/consent-versions",
  "/v1/kyc/case-types",
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
    const sub = await verifyAccessToken(c.env, token);
    c.set("userId", sub);
    c.set("accessToken", token);

    await next();
  },
);
