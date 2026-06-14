import * as jose from "jose";
import { ApiError } from "@mediamedicine/shared/errors";
import type { AuthSession } from "@mediamedicine/shared/schemas";
import type { Env } from "../env";
import { intentToCreateUser, mapGoTrueError, type GoTrueErrorBody, type GoTrueSessionBody } from "./auth-errors";

function authBaseUrl(env: Env): string {
  return `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1`;
}

function anonHeaders(env: Env): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
  };
}

function bearerHeaders(env: Env, token: string): HeadersInit {
  return {
    ...anonHeaders(env),
    Authorization: `Bearer ${token}`,
  };
}

function serviceHeaders(env: Env): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function decodeSessionId(accessToken: string): Promise<string | undefined> {
  try {
    const payload = jose.decodeJwt(accessToken);
    const sessionId = payload.session_id;
    return typeof sessionId === "string" ? sessionId : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeSession(data: GoTrueSessionBody, accessToken?: string): AuthSession {
  if (!data.access_token || !data.refresh_token || !data.user?.id) {
    throw new ApiError(
      "auth_failed",
      data.error_description ?? data.msg ?? "Authentication failed",
      401,
    );
  }

  const token = accessToken ?? data.access_token;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
    tokenType: data.token_type ?? "bearer",
    sessionId: undefined, // filled by caller via decodeSessionId when needed
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
}

export async function gotrueSendOtp(
  env: Env,
  email: string,
  intent: "signup" | "login" | "auto",
): Promise<{ ok: true }> {
  const res = await fetch(`${authBaseUrl(env)}/otp`, {
    method: "POST",
    headers: anonHeaders(env),
    body: JSON.stringify({
      email,
      create_user: intentToCreateUser(intent),
    }),
  });

  const data = await parseJson<GoTrueSessionBody>(res);
  if (!res.ok) {
    throw mapGoTrueError(res.status, data);
  }
  return { ok: true };
}

export async function gotrueVerifyOtp(
  env: Env,
  email: string,
  code: string,
): Promise<AuthSession> {
  const res = await fetch(`${authBaseUrl(env)}/verify`, {
    method: "POST",
    headers: anonHeaders(env),
    body: JSON.stringify({
      type: "email",
      email,
      token: code,
    }),
  });

  const data = await parseJson<GoTrueSessionBody>(res);
  if (!res.ok) {
    throw mapGoTrueError(res.status, data);
  }

  const session = normalizeSession(data);
  session.sessionId = await decodeSessionId(session.accessToken);
  return session;
}

export async function gotrueRefresh(
  env: Env,
  refreshToken: string,
): Promise<AuthSession> {
  const res = await fetch(`${authBaseUrl(env)}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: anonHeaders(env),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await parseJson<GoTrueSessionBody>(res);
  if (!res.ok) {
    throw mapGoTrueError(res.status, data);
  }

  const session = normalizeSession(data);
  session.sessionId = await decodeSessionId(session.accessToken);
  return session;
}

export async function gotrueLogout(
  env: Env,
  accessToken: string,
  refreshToken: string | undefined,
  scope: "local" | "others" | "global",
): Promise<void> {
  const url = new URL(`${authBaseUrl(env)}/logout`);
  url.searchParams.set("scope", scope);

  await fetch(url.toString(), {
    method: "POST",
    headers: bearerHeaders(env, accessToken),
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  });
}

export interface GoTrueUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  created_at?: string;
}

export async function gotrueGetUser(env: Env, accessToken: string): Promise<GoTrueUser> {
  const res = await fetch(`${authBaseUrl(env)}/user`, {
    method: "GET",
    headers: bearerHeaders(env, accessToken),
  });

  const data = await parseJson<{ user?: GoTrueUser } & GoTrueUser & GoTrueErrorBody>(res);
  const user = data.user?.id ? data.user : data.id ? data : undefined;
  if (!res.ok || !user?.id) {
    throw mapGoTrueError(res.status, data);
  }
  return user;
}

export async function gotrueUpdateEmail(
  env: Env,
  accessToken: string,
  email: string,
): Promise<void> {
  const res = await fetch(`${authBaseUrl(env)}/user`, {
    method: "PUT",
    headers: bearerHeaders(env, accessToken),
    body: JSON.stringify({ email }),
  });

  const data = await parseJson<GoTrueErrorBody>(res);
  if (!res.ok) {
    throw mapGoTrueError(res.status, data);
  }
}

export async function gotrueExchangePkce(
  env: Env,
  authCode: string,
  codeVerifier: string,
): Promise<AuthSession> {
  const res = await fetch(`${authBaseUrl(env)}/token?grant_type=pkce`, {
    method: "POST",
    headers: anonHeaders(env),
    body: JSON.stringify({
      auth_code: authCode,
      code_verifier: codeVerifier,
    }),
  });

  const data = await parseJson<GoTrueSessionBody>(res);
  if (!res.ok) {
    throw mapGoTrueError(res.status, data);
  }

  const session = normalizeSession(data);
  session.sessionId = await decodeSessionId(session.accessToken);
  return session;
}

export function buildOAuthAuthorizeUrl(
  env: Env,
  provider: string,
  redirectTo: string,
  codeChallenge: string,
  state: string,
): string {
  const url = new URL(`${authBaseUrl(env)}/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return url.toString();
}

export { serviceHeaders };

export async function gotrueMfaListFactors(env: Env, accessToken: string) {
  const res = await fetch(`${authBaseUrl(env)}/factors`, {
    headers: bearerHeaders(env, accessToken),
  });
  const data = await parseJson<{ factors?: unknown[]; msg?: string }>(res);
  if (!res.ok) throw mapGoTrueError(res.status, data);
  return data.factors ?? [];
}

export async function gotrueMfaEnrollTotp(env: Env, accessToken: string) {
  const res = await fetch(`${authBaseUrl(env)}/factors`, {
    method: "POST",
    headers: bearerHeaders(env, accessToken),
    body: JSON.stringify({ factor_type: "totp", friendly_name: "Authenticator" }),
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) throw mapGoTrueError(res.status, data);
  return data;
}

export async function gotrueMfaVerifyTotp(
  env: Env,
  accessToken: string,
  factorId: string,
  code: string,
) {
  const res = await fetch(`${authBaseUrl(env)}/factors/${factorId}/verify`, {
    method: "POST",
    headers: bearerHeaders(env, accessToken),
    body: JSON.stringify({ code, challenge_id: factorId }),
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) throw mapGoTrueError(res.status, data);
  return data;
}

export async function gotrueMfaChallenge(env: Env, accessToken: string, factorId: string) {
  const res = await fetch(`${authBaseUrl(env)}/factors/${factorId}/challenge`, {
    method: "POST",
    headers: bearerHeaders(env, accessToken),
  });
  const data = await parseJson<Record<string, unknown>>(res);
  if (!res.ok) throw mapGoTrueError(res.status, data);
  return data;
}

export async function gotrueMfaUnenroll(env: Env, accessToken: string, factorId: string) {
  const res = await fetch(`${authBaseUrl(env)}/factors/${factorId}`, {
    method: "DELETE",
    headers: bearerHeaders(env, accessToken),
  });
  if (!res.ok) {
    const data = await parseJson<GoTrueErrorBody>(res);
    throw mapGoTrueError(res.status, data);
  }
}
