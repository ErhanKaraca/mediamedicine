import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { assertPlatformStaff } from "../_shared/staff.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { logAdminAction } from "../_shared/audit.ts";

const log = createLogger({ fn: "kyc-review-case" });

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

    const body = await req.json() as {
      caseId?: string;
      decision?: "approved" | "rejected" | "resubmit_required";
      notes?: string;
      documentDecisions?: Array<{
        documentId: string;
        status: "accepted" | "rejected";
        note?: string;
      }>;
    };

    if (!body.caseId || !body.decision) {
      return errorResponse("invalid_body", "caseId and decision required", 400);
    }

    const { data: kycCase } = await admin
      .from("kyc_cases")
      .select("id, user_id, profile_id, case_type, status, target_entity_type")
      .eq("id", body.caseId)
      .single();

    if (!kycCase) return errorResponse("not_found", "Case not found", 404);
    if (!["submitted", "under_review", "resubmit_required"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case is not reviewable", 409);
    }

    let finalStatus = body.decision;
    if (body.documentDecisions?.length) {
      for (const dd of body.documentDecisions) {
        await admin
          .from("kyc_documents")
          .update({
            status: dd.status,
            staff_note: dd.note?.slice(0, 500) ?? null,
          })
          .eq("id", dd.documentId)
          .eq("case_id", body.caseId);
      }
      const hasRejected = body.documentDecisions.some((d) => d.status === "rejected");
      if (hasRejected && body.decision !== "rejected") {
        finalStatus = "resubmit_required";
      }
    }

    const now = new Date().toISOString();
    await admin.from("kyc_cases").update({
      status: finalStatus,
      review_notes: body.notes ?? null,
      reviewed_at: now,
      reviewed_by: user.id,
    }).eq("id", body.caseId);

    if (finalStatus === "approved" && kycCase.case_type === "healthcare_professional" && kycCase.profile_id) {
      await admin.from("profiles").update({
        account_kind: "professional",
        is_verified: true,
      }).eq("id", kycCase.profile_id);

      await admin.from("moderation_actions").insert({
        moderator_user_id: user.id,
        target_type: "profile",
        target_id: kycCase.profile_id,
        action: "kyc_approved",
        reason: body.notes ?? null,
        metadata: { kyc_case_id: body.caseId, case_type: kycCase.case_type },
      });
    }

    invokeEmitNotification({
      recipientUserId: kycCase.user_id,
      recipientProfileId: kycCase.profile_id ?? undefined,
      eventType: "kyc_decision",
      entityType: "kyc_case",
      entityId: body.caseId,
      title: finalStatus === "approved"
        ? "KYC başvurunuz onaylandı"
        : finalStatus === "resubmit_required"
        ? "KYC: ek belge gerekli"
        : "KYC başvurunuz reddedildi",
      body: body.notes,
    }).catch((e) => log.warn("notify failed", e));

    await logAdminAction(admin, user.id, `kyc_${finalStatus}`, "kyc_case", body.caseId, {
      decision: finalStatus,
      notes: body.notes ?? null,
    });

    return json({ caseId: body.caseId, status: finalStatus });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
