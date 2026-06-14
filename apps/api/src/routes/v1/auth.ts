import type { Context } from "hono";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ApiError } from "@mediamedicine/shared/errors";
import {
  AuthEmailChangeBodySchema,
  AuthEmailChangeResponseSchema,
  AuthLogoutBodySchema,
  AuthMeResponseSchema,
  AuthRefreshBodySchema,
  AuthSessionSchema,
  AuthSessionItemSchema,
  AuthSessionsResponseSchema,
  OAuthProviderSchema,
  OtpSendBodySchema,
  OtpSendResponseSchema,
  OtpVerifyBodySchema,
} from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { recordNewSessionEvent } from "../../lib/auth-audit";
import { EMAIL_CHANGE_MESSAGE, OTP_SEND_SUCCESS_MESSAGE } from "../../lib/auth-errors";
import {
  disableSessionDeviceMetadata,
  loadDeviceMetadataMap,
  upsertSessionDeviceMetadata,
} from "../../lib/device-metadata";
import {
  assertSessionOwnedByUser,
  decodeCurrentSessionId,
  deleteUserSession,
  enforceMaxSessions,
  invalidateSessionCache,
  listUserSessionsCached,
  toSessionItems,
} from "../../lib/gotrue-admin";
import {
  buildOAuthAuthorizeUrl,
  gotrueExchangePkce,
  gotrueGetUser,
  gotrueLogout,
  gotrueMfaChallenge,
  gotrueMfaEnrollTotp,
  gotrueMfaListFactors,
  gotrueMfaUnenroll,
  gotrueMfaVerifyTotp,
  gotrueRefresh,
  gotrueSendOtp,
  gotrueUpdateEmail,
  gotrueVerifyOtp,
} from "../../lib/gotrue";
import {
  clearOAuthCookieHeader,
  generatePkcePair,
  oauthCookieHeader,
  readOAuthCookie,
  signOAuthState,
  verifyOAuthState,
} from "../../lib/oauth";
import {
  clearRefreshCookieHeader,
  isSecureRequest,
  readRefreshCookie,
  refreshCookieHeader,
  shouldUseRefreshCookie,
} from "../../lib/session-cookie";

export const authRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

type AuthContext = Context<{ Bindings: Env; Variables: AppVariables }>;

async function finalizeAuthSession(
  c: AuthContext,
  session: Awaited<ReturnType<typeof gotrueVerifyOtp>>,
  opts: {
    platform?: "ios" | "android" | "web";
    deviceName?: string;
    useCookie?: boolean;
    isNewSession?: boolean;
  },
) {
  const userAgent = c.req.header("User-Agent");
  const sessionId = session.sessionId;

  if (sessionId) {
    try {
      await upsertSessionDeviceMetadata(c.env, {
        userId: session.user.id,
        sessionId,
        deviceName: opts.deviceName,
        platform: opts.platform,
        userAgent,
      });
      await enforceMaxSessions(c.env, session.user.id, sessionId);
      await invalidateSessionCache(c.env, session.user.id);
    } catch (err) {
      console.error("post-auth session finalize failed", {
        userId: session.user.id,
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (opts.isNewSession) {
    recordNewSessionEvent(c.env, session.user.id, opts.platform, opts.deviceName);
  }

  const secure = isSecureRequest(c.req.url);
  if (shouldUseRefreshCookie(opts.platform, opts.useCookie ?? false)) {
    c.header("Set-Cookie", refreshCookieHeader(session.refreshToken, secure), { append: true });
  }

  const { refreshToken, ...publicSession } = session;
  if (shouldUseRefreshCookie(opts.platform, opts.useCookie ?? false)) {
    return { ...publicSession, refreshToken: "" };
  }
  return session;
}

const otpSendRoute = createRoute({
  method: "post",
  path: "/auth/otp/send",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: OtpSendBodySchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: OtpSendResponseSchema } },
      description: "OTP dispatch requested (always 200)",
    },
  },
});

authRoutes.openapi(otpSendRoute, async (c) => {
  const body = c.req.valid("json");
  try {
    await gotrueSendOtp(c.env, body.email, body.intent);
  } catch (err) {
    if (err instanceof ApiError && err.code === "rate_limited") throw err;
    // enumeration-safe: swallow send failures except rate limit
  }
  return c.json({ ok: true as const, message: OTP_SEND_SUCCESS_MESSAGE });
});

const otpVerifyRoute = createRoute({
  method: "post",
  path: "/auth/otp/verify",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: OtpVerifyBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: AuthSessionSchema } }, description: "Verified" },
    401: { description: "Invalid OTP" },
    404: { description: "User not found (login intent)" },
  },
});

authRoutes.openapi(otpVerifyRoute, async (c) => {
  const body = c.req.valid("json");
  const useCookie = c.req.header("X-Use-Refresh-Cookie") === "true";

  let session;
  try {
    session = await gotrueVerifyOtp(c.env, body.email, body.code);
  } catch (err) {
    if (body.intent === "login" && err instanceof ApiError && err.code === "auth_failed") {
      throw new ApiError("user_not_found", "No account found for this email", 404);
    }
    throw err;
  }

  const response = await finalizeAuthSession(c, session, {
    platform: body.platform,
    deviceName: body.deviceName,
    useCookie,
    isNewSession: true,
  });
  return c.json(response);
});

const refreshRoute = createRoute({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: AuthRefreshBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: AuthSessionSchema } }, description: "Refreshed" },
  },
});

authRoutes.openapi(refreshRoute, async (c) => {
  const body = c.req.valid("json");
  const cookieToken = readRefreshCookie(c.req.header("Cookie"));
  const refreshToken = body.refreshToken ?? cookieToken;
  if (!refreshToken) throw new ApiError("auth_failed", "Missing refresh token", 401);

  const session = await gotrueRefresh(c.env, refreshToken);
  const useCookie = Boolean(cookieToken) || c.req.header("X-Use-Refresh-Cookie") === "true";
  const secure = isSecureRequest(c.req.url);

  if (useCookie) {
    c.header("Set-Cookie", refreshCookieHeader(session.refreshToken, secure), { append: true });
    const { refreshToken: _rt, ...publicSession } = session;
    return c.json({ ...publicSession, refreshToken: "" });
  }
  return c.json(session);
});

const logoutRoute = createRoute({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: AuthLogoutBodySchema } },
      required: false,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } },
      description: "Logged out",
    },
  },
});

authRoutes.openapi(logoutRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Missing token", 401);

  let scope: "local" | "others" | "global" = "local";
  let refreshToken: string | undefined;
  const contentType = c.req.header("Content-Type");
  if (contentType?.includes("application/json")) {
    try {
      const body = c.req.valid("json");
      scope = body.scope ?? "local";
      refreshToken = body.refreshToken;
    } catch {
      // empty body ok
    }
  }

  const cookieToken = readRefreshCookie(c.req.header("Cookie"));
  refreshToken = refreshToken ?? cookieToken;

  await gotrueLogout(c.env, token, refreshToken, scope);

  const userId = c.get("userId");
  if (userId) {
    await invalidateSessionCache(c.env, userId);
    const sessionId = await decodeCurrentSessionId(token);
    if (sessionId && scope !== "others") {
      await disableSessionDeviceMetadata(c.env, userId, sessionId);
    }
    if (scope === "global" || scope === "others") {
      // device rows for revoked sessions remain disabled opportunistically on individual revoke
    }
  }

  const secure = isSecureRequest(c.req.url);
  c.header("Set-Cookie", clearRefreshCookieHeader(secure), { append: true });
  return c.json({ ok: true as const });
});

const authMeRoute = createRoute({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { content: { "application/json": { schema: AuthMeResponseSchema } }, description: "Auth user" },
  },
});

authRoutes.openapi(authMeRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);

  const user = await gotrueGetUser(c.env, token);
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      emailConfirmed: Boolean(user.email_confirmed_at),
      createdAt: user.created_at,
    },
  });
});

const sessionsListRoute = createRoute({
  method: "get",
  path: "/auth/sessions",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: AuthSessionsResponseSchema } },
      description: "Active sessions",
    },
  },
});

authRoutes.openapi(sessionsListRoute, async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  if (!userId || !token) throw new ApiError("unauthorized", "Not authenticated", 401);

  const sessions = await listUserSessionsCached(c.env, userId);
  const currentSessionId = await decodeCurrentSessionId(token);
  const meta = await loadDeviceMetadataMap(
    c.env,
    userId,
    sessions.map((s) => s.id),
  );

  return c.json({ items: toSessionItems(sessions, currentSessionId, meta) });
});

const sessionDeleteRoute = createRoute({
  method: "delete",
  path: "/auth/sessions/{sessionId}",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ sessionId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } },
      description: "Session revoked",
    },
  },
});

authRoutes.openapi(sessionDeleteRoute, async (c) => {
  const userId = c.get("userId");
  if (!userId) throw new ApiError("unauthorized", "Not authenticated", 401);

  const { sessionId } = c.req.valid("param");
  await assertSessionOwnedByUser(c.env, userId, sessionId);
  await deleteUserSession(c.env, userId, sessionId);
  await disableSessionDeviceMetadata(c.env, userId, sessionId);
  return c.json({ ok: true as const });
});

const oauthStartRoute = createRoute({
  method: "get",
  path: "/auth/oauth/{provider}",
  tags: ["Auth"],
  request: {
    params: z.object({ provider: OAuthProviderSchema }),
    query: z.object({
      redirectTo: z.string().url().optional(),
    }),
  },
  responses: {
    302: { description: "Redirect to provider" },
  },
});

authRoutes.openapi(oauthStartRoute, async (c) => {
  const { provider } = c.req.valid("param");
  const query = c.req.valid("query");
  const { codeVerifier, codeChallenge } = await generatePkcePair();
  const state = crypto.randomUUID();

  const requestUrl = new URL(c.req.url);
  const callbackUrl = `${requestUrl.origin}/v1/auth/callback`;

  const signed = await signOAuthState(c.env, {
    state,
    codeVerifier,
    redirectTo: query.redirectTo,
  });

  const authorizeUrl = buildOAuthAuthorizeUrl(
    c.env,
    provider,
    callbackUrl,
    codeChallenge,
    state,
  );

  const secure = isSecureRequest(c.req.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      "Set-Cookie": oauthCookieHeader(signed, secure),
    },
  });
});

const oauthCallbackRoute = createRoute({
  method: "get",
  path: "/auth/callback",
  tags: ["Auth"],
  request: {
    query: z.object({
      code: z.string().optional(),
      state: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { "application/json": { schema: AuthSessionSchema } }, description: "OAuth session" },
    302: { description: "Redirect to app with session" },
  },
});

authRoutes.openapi(oauthCallbackRoute, async (c) => {
  const query = c.req.valid("query");
  if (query.error) {
    throw new ApiError("oauth_failed", query.error_description ?? query.error, 401);
  }
  if (!query.code || !query.state) {
    throw new ApiError("oauth_failed", "Missing OAuth callback parameters", 400);
  }

  const cookie = readOAuthCookie(c.req.header("Cookie"));
  if (!cookie) throw new ApiError("oauth_failed", "OAuth state expired", 401);

  const stored = await verifyOAuthState(c.env, cookie);
  if (stored.state !== query.state) {
    throw new ApiError("oauth_failed", "Invalid OAuth state", 401);
  }

  const session = await gotrueExchangePkce(c.env, query.code, stored.codeVerifier);
  const response = await finalizeAuthSession(c, session, {
    platform: "web",
    isNewSession: true,
    useCookie: true,
  });

  const secure = isSecureRequest(c.req.url);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", clearOAuthCookieHeader(secure));

  if (stored.redirectTo) {
    const redirectUrl = new URL(stored.redirectTo);
    redirectUrl.searchParams.set("accessToken", response.accessToken);
    if (response.refreshToken) {
      redirectUrl.searchParams.set("refreshToken", response.refreshToken);
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
        "Set-Cookie": clearOAuthCookieHeader(secure),
      },
    });
  }

  headers.append("Set-Cookie", refreshCookieHeader(session.refreshToken, secure));
  return new Response(JSON.stringify(response), { status: 200, headers });
});

const emailChangeRoute = createRoute({
  method: "patch",
  path: "/auth/email",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: AuthEmailChangeBodySchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthEmailChangeResponseSchema } },
      description: "Email change initiated (GoTrue confirmation link)",
    },
  },
});

authRoutes.openapi(emailChangeRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);

  const body = c.req.valid("json");
  await gotrueUpdateEmail(c.env, token, body.email);
  return c.json({ ok: true as const, message: EMAIL_CHANGE_MESSAGE });
});

const mfaFactorsRoute = createRoute({
  method: "get",
  path: "/auth/mfa/factors",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ factors: z.array(z.record(z.unknown())) }),
        },
      },
      description: "MFA factors",
    },
  },
});

authRoutes.openapi(mfaFactorsRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  const factors = await gotrueMfaListFactors(c.env, token);
  return c.json({ factors });
});

const mfaEnrollRoute = createRoute({
  method: "post",
  path: "/auth/mfa/totp/enroll",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { content: { "application/json": { schema: z.record(z.unknown()) } }, description: "TOTP enroll" },
  },
});

authRoutes.openapi(mfaEnrollRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  const data = await gotrueMfaEnrollTotp(c.env, token);
  return c.json(data);
});

const mfaVerifyRoute = createRoute({
  method: "post",
  path: "/auth/mfa/totp/verify",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ factorId: z.string().uuid(), code: z.string().min(6).max(8) }),
        },
      },
    },
  },
  responses: {
    200: { content: { "application/json": { schema: z.record(z.unknown()) } }, description: "TOTP verified" },
  },
});

authRoutes.openapi(mfaVerifyRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  const body = c.req.valid("json");
  const data = await gotrueMfaVerifyTotp(c.env, token, body.factorId, body.code);
  return c.json(data);
});

const mfaChallengeRoute = createRoute({
  method: "post",
  path: "/auth/mfa/challenge",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: z.object({ factorId: z.string().uuid() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: z.record(z.unknown()) } }, description: "MFA challenge" },
  },
});

authRoutes.openapi(mfaChallengeRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  const body = c.req.valid("json");
  const data = await gotrueMfaChallenge(c.env, token, body.factorId);
  return c.json(data);
});

const mfaUnenrollRoute = createRoute({
  method: "delete",
  path: "/auth/mfa/totp/{factorId}",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ factorId: z.string().uuid() }) },
  responses: {
    204: { description: "Factor removed" },
  },
});

authRoutes.openapi(mfaUnenrollRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  const { factorId } = c.req.valid("param");
  await gotrueMfaUnenroll(c.env, token, factorId);
  return c.body(null, 204);
});
