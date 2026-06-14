import * as jose from "jose";
import type { Env } from "../env";

const COOKIE_NAME = "mm_oauth_pkce";
const COOKIE_MAX_AGE = 600;

export interface OAuthStatePayload {
  state: string;
  codeVerifier: string;
  redirectTo?: string;
}

function secretKey(env: Env): Uint8Array {
  return new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
}

export async function signOAuthState(
  env: Env,
  payload: OAuthStatePayload,
): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(secretKey(env));
}

export async function verifyOAuthState(
  env: Env,
  token: string,
): Promise<OAuthStatePayload> {
  const { payload } = await jose.jwtVerify(token, secretKey(env), {
    algorithms: ["HS256"],
  });

  const state = payload.state;
  const codeVerifier = payload.codeVerifier;
  if (typeof state !== "string" || typeof codeVerifier !== "string") {
    throw new Error("Invalid OAuth state payload");
  }

  return {
    state,
    codeVerifier,
    redirectTo: typeof payload.redirectTo === "string" ? payload.redirectTo : undefined,
  };
}

export function oauthCookieHeader(signed: string, secure: boolean): string {
  const parts = [
    `${COOKIE_NAME}=${signed}`,
    "HttpOnly",
    "Path=/v1/auth",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearOAuthCookieHeader(secure: boolean): string {
  const parts = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/v1/auth", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readOAuthCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

export async function generatePkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = randomString(64);
  const codeChallenge = await base64UrlSha256(codeVerifier);
  return { codeVerifier, codeChallenge };
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return base64UrlEncode(bytes).slice(0, length);
}

async function base64UrlSha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export { COOKIE_NAME as OAUTH_COOKIE_NAME };
