import { getEdgeFunctionUrl } from "@mediamedicine/shared/edge-map";
import { ApiError } from "@mediamedicine/shared/errors";
import type { Env } from "../env";

export interface EdgeProxyOptions {
  functionName: string;
  method: string;
  body?: unknown;
  headers: Headers;
  accessToken?: string;
  pathParams?: Record<string, string>;
}

function mergePathParams(body: unknown, pathParams?: Record<string, string>): unknown {
  if (!pathParams || Object.keys(pathParams).length === 0) return body;
  const base = body && typeof body === "object" && !Array.isArray(body) ? { ...(body as Record<string, unknown>) } : {};
  for (const [key, value] of Object.entries(pathParams)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (base[camel] === undefined && base[key] === undefined) {
      base[camel] = value;
    }
  }
  return base;
}

export async function proxyToEdge(
  env: Env,
  options: EdgeProxyOptions,
): Promise<Response> {
  const url = getEdgeFunctionUrl(env.SUPABASE_URL, options.functionName);
  const forwardHeaders = new Headers();
  forwardHeaders.set("Content-Type", "application/json");

  const requestId = options.headers.get("X-Request-Id");
  if (requestId) forwardHeaders.set("X-Request-Id", requestId);

  const idempotencyKey = options.headers.get("Idempotency-Key");
  if (idempotencyKey) forwardHeaders.set("Idempotency-Key", idempotencyKey);

  if (options.accessToken) {
    forwardHeaders.set("Authorization", `Bearer ${options.accessToken}`);
  } else {
    forwardHeaders.set("apikey", env.SUPABASE_ANON_KEY);
  }

  const payload =
    options.method !== "GET" && options.method !== "HEAD"
      ? JSON.stringify(mergePathParams(options.body, options.pathParams))
      : undefined;

  const res = await fetch(url, {
    method: options.method === "DELETE" ? "POST" : options.method,
    headers: forwardHeaders,
    body: payload,
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("internal_error", "Invalid edge response", 502);
  }

  return new Response(JSON.stringify(parsed), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
