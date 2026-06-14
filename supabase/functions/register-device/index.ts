import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "register-device" });

const VALID_PLATFORMS = ["ios", "android", "web"] as const;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as { platform?: string; pushToken?: string; enabled?: boolean };
    if (!body.platform || !body.pushToken) {
      return errorResponse("invalid_body", "platform and pushToken required", 400);
    }
    if (!VALID_PLATFORMS.includes(body.platform as typeof VALID_PLATFORMS[number])) {
      return errorResponse("invalid_platform", "platform must be ios, android, or web", 400);
    }

    const { data: device, error: upsertErr } = await supabase
      .from("user_devices")
      .upsert({
        user_id: user.id,
        platform: body.platform,
        push_token: body.pushToken,
        enabled: body.enabled ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform,push_token" })
      .select("id, platform, enabled")
      .single();

    if (upsertErr) {
      log.error("upsert failed", upsertErr);
      return errorResponse("upsert_failed", upsertErr.message, 400);
    }

    return json({ deviceId: device.id, platform: device.platform, enabled: device.enabled });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
