import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";

const log = createLogger({ fn: "submit-professional-application" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { profileId, notes } = await req.json() as { profileId?: string; notes?: string };
    if (!profileId) return errorResponse("invalid_body", "profileId required", 400);

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_kind, owner_user_id")
      .eq("id", profileId)
      .single();

    if (!profile || profile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }
    if (profile.account_kind !== "user") {
      return errorResponse("invalid_profile", "Only user profiles can apply", 400);
    }

    const { data: existing } = await supabase
      .from("professional_applications")
      .select("id, status")
      .eq("profile_id", profileId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return errorResponse("already_pending", "Application already pending", 409);
    }

    const { data: app, error: insErr } = await supabase
      .from("professional_applications")
      .insert({
        user_id: user.id,
        profile_id: profileId,
        notes: notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insErr || !app) return errorResponse("insert_failed", insErr?.message ?? "Failed", 400);

    const admin = createAdminClient();
    const { data: staff } = await admin
      .from("platform_staff")
      .select("user_id")
      .eq("status", "active");

    for (const s of staff ?? []) {
      invokeEmitNotification({
        recipientUserId: s.user_id,
        eventType: "professional_application",
        entityType: "professional_application",
        entityId: app.id,
        title: "Yeni profesyonel başvurusu",
        body: notes?.slice(0, 120),
      }).catch((e) => log.warn("staff notify failed", e));
    }

    return json({ applicationId: app.id, status: "pending" }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
