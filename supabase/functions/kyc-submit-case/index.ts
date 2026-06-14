import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { validateKycPayload, type JsonSchema } from "../_shared/kyc.ts";
import { createLogger } from "../_shared/log.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";

const log = createLogger({ fn: "kyc-submit-case" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as { caseId?: string };
    if (!body.caseId) return errorResponse("invalid_body", "caseId required", 400);

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, user_id, status, case_type, case_type_version, payload, profile_id")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }
    if (!["draft", "resubmit_required"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case cannot be submitted", 409);
    }

    const { data: caseTypeRow } = await supabase
      .from("kyc_case_types")
      .select("code, version, schema, required_document_types, is_current")
      .eq("code", kycCase.case_type)
      .eq("version", kycCase.case_type_version)
      .single();

    if (!caseTypeRow) return errorResponse("unknown_case_type", "Case type version not found", 400);

    const { data: currentType } = await supabase
      .from("kyc_case_types")
      .select("version, schema, required_document_types")
      .eq("code", kycCase.case_type)
      .eq("is_current", true)
      .single();

    if (currentType && currentType.version !== kycCase.case_type_version) {
      return errorResponse("outdated_case_type", "Case type schema is outdated", 409, {
        currentVersion: currentType.version,
        requiredFields: (currentType.schema as JsonSchema).required ?? [],
      });
    }

    const payloadErr = validateKycPayload(caseTypeRow.schema as JsonSchema, kycCase.payload as Record<string, unknown>);
    if (payloadErr) return errorResponse(payloadErr, "Payload validation failed", 400);

    const { data: docs } = await supabase
      .from("kyc_documents")
      .select("document_type, status")
      .eq("case_id", body.caseId)
      .is("superseded_by", null);

    const requiredTypes = caseTypeRow.required_document_types as string[];
    const docTypes = new Set((docs ?? []).filter((d) => d.status !== "rejected").map((d) => d.document_type));

    for (const reqType of requiredTypes) {
      if (!docTypes.has(reqType)) {
        return errorResponse("missing_document", `Required document: ${reqType}`, 400);
      }
    }

    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("kyc_cases")
      .update({ status: "submitted", submitted_at: now })
      .eq("id", body.caseId);

    if (updErr) return errorResponse("update_failed", updErr.message, 500);

    const admin = createAdminClient();
    const { data: staff } = await admin.from("platform_staff").select("user_id").eq("status", "active");

    for (const s of staff ?? []) {
      invokeEmitNotification({
        recipientUserId: s.user_id,
        eventType: "kyc_submitted",
        entityType: "kyc_case",
        entityId: body.caseId,
        title: "Yeni KYC başvurusu",
        body: kycCase.case_type,
      }).catch((e) => log.warn("staff notify failed", e));
    }

    return json({ caseId: body.caseId, status: "submitted", submittedAt: now });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
