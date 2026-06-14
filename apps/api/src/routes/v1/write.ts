import { OpenAPIHono } from "@hono/zod-openapi";
import { EDGE_ROUTE_MAP } from "@mediamedicine/shared/edge-map";
import { ApiError } from "@mediamedicine/shared/errors";
import type { AppVariables, Env } from "../../env";
import { proxyToEdge } from "../../lib/edge-proxy";
import { gotrueLogout } from "../../lib/gotrue";
import { invalidateSessionCache } from "../../lib/gotrue-admin";
import { clearRefreshCookieHeader, isSecureRequest, readRefreshCookie } from "../../lib/session-cookie";

export const writeRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

function pathToPattern(path: string): string {
  return path.replace(/:([a-zA-Z]+)/g, ":$1");
}

function matchRoute(method: string, pathname: string): {
  mapping: (typeof EDGE_ROUTE_MAP)[number];
  params: Record<string, string>;
} | null {
  for (const mapping of EDGE_ROUTE_MAP) {
    if (mapping.method !== method) continue;
    const parts = mapping.path.replace("/v1", "").split("/").filter(Boolean);
    const urlParts = pathname.replace(/^\/v1\/?/, "").split("/").filter(Boolean);
    if (parts.length !== urlParts.length) continue;

    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      const u = urlParts[i]!;
      if (p.startsWith(":")) {
        params[p.slice(1)] = u;
      } else if (p !== u) {
        matched = false;
        break;
      }
    }
    if (matched) return { mapping, params };
  }
  return null;
}

writeRoutes.all("/*", async (c) => {
  const url = new URL(c.req.url);
  const matched = matchRoute(c.req.method, url.pathname);
  if (!matched) {
    throw new ApiError("not_found", "Route not found", 404);
  }

  const { mapping, params } = matched;
  if (mapping.requiresAuth) {
    const token = c.get("accessToken");
    if (!token) throw new ApiError("unauthorized", "Not authenticated", 401);
  }

  let body: unknown = undefined;
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
  }

  if (mapping.functionName === "delete-account" && mapping.requiresAuth) {
    const token = c.get("accessToken");
    const userId = c.get("userId");
    if (token && userId) {
      const refreshToken = readRefreshCookie(c.req.header("Cookie"));
      await gotrueLogout(c.env, token, refreshToken, "global");
      await invalidateSessionCache(c.env, userId);
      const secure = isSecureRequest(c.req.url);
      c.header("Set-Cookie", clearRefreshCookieHeader(secure), { append: true });
    }
  }

  const edgeMethod = mapping.method === "DELETE" ? "POST" : mapping.method;

  return proxyToEdge(c.env, {
    functionName: mapping.functionName,
    method: edgeMethod,
    body,
    headers: c.req.raw.headers,
    accessToken: c.get("accessToken"),
    pathParams: params,
  });
});

// Export pattern helper for tests
export { pathToPattern, matchRoute };
