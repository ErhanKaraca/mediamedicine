import { handlePreflight } from "../_shared/cors.ts";
import { json, errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method === "GET") {
    return json({ status: "ok", service: "mediamedicine-edge", ts: Date.now() });
  }

  return errorResponse("method_not_allowed", "GET only", 405);
});
