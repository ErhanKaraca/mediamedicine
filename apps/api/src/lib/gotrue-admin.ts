import { ApiError } from "@mediamedicine/shared/errors";
import type { AuthSessionItem } from "@mediamedicine/shared/schemas";
import type { Env } from "../env";
import { createServiceClient } from "./supabase";

const SESSION_CACHE_TTL_SECONDS = 60;
const MAX_ACTIVE_SESSIONS = 10;

export interface GoTrueAdminSession {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  refreshed_at?: string | null;
  user_agent?: string | null;
  ip?: string | null;
}

function cacheKey(userId: string): string {
  return `sessions:${userId}`;
}

export async function invalidateSessionCache(env: Env, userId: string): Promise<void> {
  if (!env.SESSION_CACHE) return;
  await env.SESSION_CACHE.delete(cacheKey(userId));
}

async function putSessionCache(
  env: Env,
  userId: string,
  sessions: GoTrueAdminSession[],
): Promise<void> {
  if (!env.SESSION_CACHE) return;
  try {
    await env.SESSION_CACHE.put(cacheKey(userId), JSON.stringify(sessions), {
      expirationTtl: SESSION_CACHE_TTL_SECONDS,
    });
  } catch (err) {
    console.error("session cache put failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function fetchUserSessions(env: Env, userId: string): Promise<GoTrueAdminSession[]> {
  const admin = createServiceClient(env);
  const { data, error } = await admin.rpc("list_user_auth_sessions", {
    p_user_id: userId,
  });

  if (error) {
    throw new ApiError("internal_error", error.message, 500);
  }

  return (data ?? []) as GoTrueAdminSession[];
}

export async function listUserSessionsCached(
  env: Env,
  userId: string,
): Promise<GoTrueAdminSession[]> {
  if (env.SESSION_CACHE) {
    const cached = await env.SESSION_CACHE.get(cacheKey(userId), "json");
    if (cached && Array.isArray(cached)) {
      return cached as GoTrueAdminSession[];
    }
  }

  const sessions = await fetchUserSessions(env, userId);
  await putSessionCache(env, userId, sessions);
  return sessions;
}

export async function deleteUserSession(
  env: Env,
  userId: string,
  sessionId: string,
): Promise<void> {
  const admin = createServiceClient(env);
  const { data, error } = await admin.rpc("revoke_user_auth_session", {
    p_user_id: userId,
    p_session_id: sessionId,
  });

  if (error) {
    throw new ApiError("internal_error", error.message, 500);
  }

  if (!data) {
    throw new ApiError("not_found", "Session not found", 404);
  }

  await invalidateSessionCache(env, userId);
}

export function sessionLastUsedAt(session: GoTrueAdminSession): string {
  return session.refreshed_at ?? session.updated_at ?? session.created_at;
}

export function toSessionItems(
  sessions: GoTrueAdminSession[],
  currentSessionId: string | undefined,
  deviceMeta: Map<string, { deviceName?: string; platform?: string }>,
): AuthSessionItem[] {
  const allowedPlatforms = new Set(["ios", "android", "web"]);

  return sessions.map((s) => {
    const meta = deviceMeta.get(s.id);
    const platform = meta?.platform;
    return {
      id: s.id,
      createdAt: s.created_at,
      lastUsedAt: sessionLastUsedAt(s),
      userAgent: s.user_agent ?? undefined,
      ip: normalizeSessionIp(s.ip),
      deviceName: meta?.deviceName,
      platform:
        platform && allowedPlatforms.has(platform)
          ? (platform as AuthSessionItem["platform"])
          : undefined,
      current: currentSessionId ? s.id === currentSessionId : undefined,
    };
  });
}

function normalizeSessionIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return ip.replace(/\/\d+$/, "");
}

export async function enforceMaxSessions(
  env: Env,
  userId: string,
  currentSessionId: string | undefined,
): Promise<void> {
  if (!currentSessionId) return;

  const sessions = await listUserSessionsCached(env, userId);
  if (sessions.length <= MAX_ACTIVE_SESSIONS) return;

  const sorted = [...sessions].sort(
    (a, b) => new Date(sessionLastUsedAt(a)).getTime() - new Date(sessionLastUsedAt(b)).getTime(),
  );

  let toRevoke = sessions.length - MAX_ACTIVE_SESSIONS;
  for (const session of sorted) {
    if (toRevoke <= 0) break;
    if (session.id === currentSessionId) continue;
    await deleteUserSession(env, userId, session.id);
    toRevoke--;
  }
}

export async function decodeCurrentSessionId(accessToken: string): Promise<string | undefined> {
  const { decodeSessionId } = await import("./gotrue");
  return decodeSessionId(accessToken);
}

export async function assertSessionOwnedByUser(
  env: Env,
  userId: string,
  sessionId: string,
): Promise<void> {
  const sessions = await listUserSessionsCached(env, userId);
  if (!sessions.some((s) => s.id === sessionId)) {
    throw new ApiError("not_found", "Session not found", 404);
  }
}

export { MAX_ACTIVE_SESSIONS };
