import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { captureTargetSnapshot } from "../_shared/audit.ts";

const log = createLogger({ fn: "submit-report" });

const VALID_TARGETS = ["post", "comment", "profile", "message"] as const;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as {
      reporterProfileId?: string;
      targetType?: string;
      targetId?: string;
      reasonCode?: string;
      details?: string;
    };

    if (!body.reporterProfileId || !body.targetType || !body.targetId || !body.reasonCode) {
      return errorResponse("invalid_body", "Missing required fields", 400);
    }

    if (!VALID_TARGETS.includes(body.targetType as typeof VALID_TARGETS[number])) {
      return errorResponse("invalid_target", "Unknown target type", 400);
    }

    const admin = createAdminClient();
    const targetSnapshot = await captureTargetSnapshot(admin, body.targetType, body.targetId);

    const { data: report, error: insertErr } = await supabase.from("reports").insert({
      reporter_profile_id: body.reporterProfileId,
      target_type: body.targetType,
      target_id: body.targetId,
      reason_code: body.reasonCode,
      details: body.details ?? null,
      target_snapshot: targetSnapshot,
    }).select("id").single();

    if (insertErr || !report) {
      log.error("insert failed", insertErr);
      return errorResponse("insert_failed", insertErr?.message ?? "Could not submit report", 400);
    }

    const { data: staff } = await admin.from("platform_staff").select("user_id").eq("status", "active");
    for (const s of staff ?? []) {
      invokeEmitNotification({
        recipientUserId: s.user_id,
        eventType: "moderation_action",
        entityType: "report",
        entityId: report.id,
        title: "Yeni şikayet",
        body: `${body.targetType}: ${body.reasonCode}`,
      }).catch((e) => log.warn("staff notify failed", e));
    }

    return json({ reportId: report.id }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
