import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { assertPlatformStaff } from "../_shared/staff.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { logAdminAction } from "../_shared/audit.ts";

const log = createLogger({ fn: "review-professional-application" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const admin = createAdminClient();
    const staff = await assertPlatformStaff(admin, user.id);
    if (!staff) return errorResponse("forbidden", "Platform staff required", 403);

    const { applicationId, decision, notes } = await req.json() as {
      applicationId?: string;
      decision?: "approved" | "rejected";
      notes?: string;
    };

    if (!applicationId || !decision) {
      return errorResponse("invalid_body", "applicationId and decision required", 400);
    }
    if (decision !== "approved" && decision !== "rejected") {
      return errorResponse("invalid_decision", "decision must be approved or rejected", 400);
    }

    const { data: app } = await admin
      .from("professional_applications")
      .select("id, user_id, profile_id, status")
      .eq("id", applicationId)
      .single();

    if (!app) return errorResponse("not_found", "Application not found", 404);
    if (app.status !== "pending") {
      return errorResponse("invalid_state", "Application already reviewed", 409);
    }

    const { error: updErr } = await admin.from("professional_applications").update({
      status: decision,
      notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }).eq("id", applicationId);

    if (updErr) return errorResponse("update_failed", updErr.message, 500);

    if (decision === "approved") {
      await admin.from("profiles").update({ account_kind: "professional" }).eq("id", app.profile_id);
    }

    invokeEmitNotification({
      recipientUserId: app.user_id,
      recipientProfileId: app.profile_id,
      eventType: "professional_application",
      entityType: "professional_application",
      entityId: applicationId,
      title: decision === "approved" ? "Profesyonel başvurunuz onaylandı" : "Profesyonel başvurunuz reddedildi",
      body: notes,
    }).catch((e) => log.warn("notify failed", e));

    await logAdminAction(admin, user.id, `professional_application_${decision}`, "professional_application", applicationId, {
      profileId: app.profile_id,
      notes: notes ?? null,
    });

    return json({ applicationId, status: decision });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
