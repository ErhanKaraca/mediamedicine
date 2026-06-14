import * as jose from "jose";
import { ApiError } from "@mediamedicine/shared/errors";
import type { Env } from "../env";

const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function supabaseAuthIssuer(env: Env): string {
  return `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
}

function getJwks(env: Env): ReturnType<typeof jose.createRemoteJWKSet> {
  const url = `${supabaseAuthIssuer(env)}/.well-known/jwks.json`;
  let set = jwksCache.get(url);
  if (!set) {
    set = jose.createRemoteJWKSet(new URL(url));
    jwksCache.set(url, set);
  }
  return set;
}

function extractSub(payload: jose.JWTPayload): string {
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new ApiError("unauthorized", "Invalid token subject", 401);
  }
  return sub;
}

export async function verifyAccessToken(env: Env, token: string): Promise<string> {
  let alg: string | undefined;
  try {
    alg = jose.decodeProtectedHeader(token).alg;
  } catch {
    throw new ApiError("unauthorized", "Invalid or expired token", 401);
  }

  const issuer = supabaseAuthIssuer(env);

  try {
    if (alg === "HS256") {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret, {
        algorithms: ["HS256"],
        issuer,
        audience: "authenticated",
      });
      return extractSub(payload);
    }

    if (alg === "ES256" || alg === "RS256") {
      const { payload } = await jose.jwtVerify(token, getJwks(env), {
        algorithms: [alg],
        issuer,
        audience: "authenticated",
      });
      return extractSub(payload);
    }

    throw new ApiError("unauthorized", "Invalid or expired token", 401);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("unauthorized", "Invalid or expired token", 401);
  }
}
