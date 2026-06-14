import { describe, it, expect } from "vitest";
import { ApiError } from "@mediamedicine/shared/errors";
import {
  intentToCreateUser,
  mapGoTrueError,
  OTP_SEND_SUCCESS_MESSAGE,
} from "./auth-errors";

describe("auth-errors", () => {
  it("maps GoTrue 429 to rate_limited", () => {
    const err = mapGoTrueError(429, { msg: "Too many requests" });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("rate_limited");
    expect(err.status).toBe(429);
  });

  it("maps invalid OTP messages", () => {
    const err = mapGoTrueError(400, { error_description: "Invalid OTP token" });
    expect(err.code).toBe("invalid_otp");
    expect(err.status).toBe(401);
  });

  it("intentToCreateUser maps signup/login/auto", () => {
    expect(intentToCreateUser("signup")).toBe(true);
    expect(intentToCreateUser("login")).toBe(false);
    expect(intentToCreateUser("auto")).toBe(true);
  });

  it("OTP send success message is generic", () => {
    expect(OTP_SEND_SUCCESS_MESSAGE.toLowerCase()).toContain("eligible");
  });
});

describe("sessionLastUsedAt ordering", () => {
  it("prefers refreshed_at over created_at", async () => {
    const { sessionLastUsedAt } = await import("./gotrue-admin");
    const session = {
      id: "1",
      user_id: "u",
      created_at: "2024-01-01T00:00:00Z",
      refreshed_at: "2024-06-01T00:00:00Z",
    };
    expect(sessionLastUsedAt(session)).toBe("2024-06-01T00:00:00Z");
  });
});

describe("oauth PKCE", () => {
  it("generates verifier and challenge pair", async () => {
    const { generatePkcePair } = await import("./oauth");
    const pair = await generatePkcePair();
    expect(pair.codeVerifier.length).toBeGreaterThan(40);
    expect(pair.codeChallenge.length).toBeGreaterThan(20);
    expect(pair.codeVerifier).not.toBe(pair.codeChallenge);
  });
});

describe("session cookie helpers", () => {
  it("reads refresh cookie", async () => {
    const { readRefreshCookie } = await import("./session-cookie");
    const token = readRefreshCookie("mm_refresh_token=abc123; other=x");
    expect(token).toBe("abc123");
  });
});

describe("jwt-verify", () => {
  it("verifies HS256 access tokens with JWT secret", async () => {
    const { SignJWT } = await import("jose");
    const { verifyAccessToken } = await import("./jwt-verify");

    const secret = new TextEncoder().encode(
      "super-secret-jwt-token-with-at-least-32-characters-long",
    );
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setIssuer(issuer)
      .setAudience("authenticated")
      .setExpirationTime("1h")
      .sign(secret);

    const sub = await verifyAccessToken(
      {
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_ANON_KEY: "test",
        SUPABASE_SERVICE_ROLE_KEY: "test",
        SUPABASE_JWT_SECRET: "super-secret-jwt-token-with-at-least-32-characters-long",
        ENVIRONMENT: "development",
        CORS_ORIGINS: "",
        RATE_LIMITER: {} as DurableObjectNamespace,
        IDEMPOTENCY: {} as DurableObjectNamespace,
      },
      token,
    );
    expect(sub).toBe("user-123");
  });
});
