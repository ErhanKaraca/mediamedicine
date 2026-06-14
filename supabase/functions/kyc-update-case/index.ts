import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "kyc-update-case" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "PATCH" && req.method !== "POST") {
    return errorResponse("method_not_allowed", "PATCH only", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as { caseId?: string; payload?: Record<string, unknown> };
    if (!body.caseId || !body.payload) {
      return errorResponse("invalid_body", "caseId and payload required", 400);
    }

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, user_id, status")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }
    if (!["draft", "resubmit_required"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case is not editable", 409);
    }

    const { data, error } = await supabase
      .from("kyc_cases")
      .update({ payload: body.payload })
      .eq("id", body.caseId)
      .select("id, case_type, case_type_version, target_entity_type, status, payload, created_at")
      .single();

    if (error) {
      const mapped = mapDbError(error);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    return json({
      id: data.id,
      caseType: data.case_type,
      caseTypeVersion: data.case_type_version,
      targetEntityType: data.target_entity_type,
      status: data.status,
      payload: data.payload,
      createdAt: data.created_at,
    });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
