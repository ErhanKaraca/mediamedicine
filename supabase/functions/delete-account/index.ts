import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "delete-account" });
const RETENTION_DAYS = 30;
const OTP_STEP_UP_MAX_AGE_MS = 5 * 60 * 1000;

async function hasTotpEnrolled(userId: string): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return false;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${userId}/factors`, {
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    });
    if (!res.ok) return false;
    const data = await res.json() as { factors?: Array<{ factor_type?: string; status?: string }> };
    return (data.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified");
  } catch {
    return false;
  }
}

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
      confirm?: boolean;
      stepUpToken?: string;
      otpVerifiedAt?: string;
    };

    if (!body.confirm) {
      return errorResponse("confirmation_required", "Set confirm: true to delete account", 400);
    }

    const admin = createAdminClient();
    const totpEnrolled = await hasTotpEnrolled(user.id);

    if (totpEnrolled) {
      if (!body.stepUpToken) {
        return errorResponse("step_up_required", "TOTP step-up required for account deletion", 403);
      }
    } else {
      if (!body.otpVerifiedAt) {
        return errorResponse("step_up_required", "Recent OTP verification required", 403);
      }
      const verifiedAt = new Date(body.otpVerifiedAt).getTime();
      if (Number.isNaN(verifiedAt) || Date.now() - verifiedAt > OTP_STEP_UP_MAX_AGE_MS) {
        return errorResponse("step_up_expired", "OTP verification is too old; verify again", 403);
      }
    }

    const now = new Date().toISOString();

    await admin.from("profiles").update({ deleted_at: now }).eq("owner_user_id", user.id);

    const scheduledHardDelete = new Date(Date.now() + RETENTION_DAYS * 86400000).toISOString();

    await admin.from("content_pipeline_runs").insert({
      resource_type: "account_deletion",
      resource_id: user.id,
      actor_user_id: user.id,
      idempotency_key: `account-delete:${user.id}`,
      status: "queued",
      context: {
        scheduledHardDelete,
        retentionDays: RETENTION_DAYS,
        phase: "soft_deleted",
        stepUp: totpEnrolled ? "totp" : "otp",
      },
    });

    await admin.from("admin_audit_log").insert({
      actor_user_id: user.id,
      action: "account_deletion_requested",
      target_type: "user",
      target_id: user.id,
      metadata: { scheduledHardDelete, stepUp: totpEnrolled ? "totp" : "otp" },
    });

    return json({
      status: "scheduled",
      softDeletedAt: now,
      hardDeleteScheduledAt: scheduledHardDelete,
    });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
