import { corsHeaders } from "./cors.ts";

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return json({ error: { code, message, ...extra } }, { status });
}
