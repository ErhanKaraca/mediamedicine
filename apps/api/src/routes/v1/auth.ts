import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ApiError } from "@mediamedicine/shared/errors";
import {
  AuthLoginBodySchema,
  AuthRefreshBodySchema,
  AuthSessionSchema,
  AuthSignupBodySchema,
} from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";

export const authRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

function authHeaders(env: Env): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
  };
}

interface GoTrueSession {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string; email?: string };
  error?: string;
  error_description?: string;
  msg?: string;
}

function normalizeSession(data: GoTrueSession) {
  if (!data.access_token || !data.refresh_token || !data.user?.id) {
    throw new ApiError("auth_failed", data.error_description ?? data.msg ?? "Authentication failed", 401);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
    tokenType: data.token_type ?? "bearer",
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
}

async function gotrueFetch(env: Env, path: string, init: RequestInit): Promise<GoTrueSession> {
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/v1${path}`, {
    ...init,
    headers: { ...authHeaders(env), ...(init.headers ?? {}) },
  });
  const data = (await res.json()) as GoTrueSession;
  if (!res.ok) {
    throw new ApiError(
      "auth_failed",
      data.error_description ?? data.msg ?? data.error ?? "Authentication failed",
      res.status === 400 ? 400 : 401,
    );
  }
  return data;
}

const signupRoute = createRoute({
  method: "post",
  path: "/auth/signup",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: AuthSignupBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: AuthSessionSchema } }, description: "Signed up" },
    400: { description: "Validation error" },
  },
});

authRoutes.openapi(signupRoute, async (c) => {
  const body = c.req.valid("json");
  const data = await gotrueFetch(c.env, "/signup", {
    method: "POST",
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      data: body.displayName ? { display_name: body.displayName } : undefined,
    }),
  });
  return c.json(normalizeSession(data));
});

const loginRoute = createRoute({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: AuthLoginBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: AuthSessionSchema } }, description: "Logged in" },
  },
});

authRoutes.openapi(loginRoute, async (c) => {
  const body = c.req.valid("json");
  const data = await gotrueFetch(c.env, "/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  return c.json(normalizeSession(data));
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
  const data = await gotrueFetch(c.env, "/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: body.refreshToken }),
  });
  return c.json(normalizeSession(data));
});

const logoutRoute = createRoute({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ ok: z.literal(true) }),
        },
      },
      description: "Logged out",
    },
  },
});

authRoutes.openapi(logoutRoute, async (c) => {
  const token = c.get("accessToken");
  if (!token) throw new ApiError("unauthorized", "Missing token", 401);

  const base = c.env.SUPABASE_URL.replace(/\/$/, "");
  await fetch(`${base}/auth/v1/logout`, {
    method: "POST",
    headers: {
      ...authHeaders(c.env),
      Authorization: `Bearer ${token}`,
    },
  });

  return c.json({ ok: true as const });
});
