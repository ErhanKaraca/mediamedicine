import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "kyc-withdraw-case" });

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
      .select("id, user_id, status")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }
    if (!["draft", "resubmit_required", "submitted"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case cannot be withdrawn", 409);
    }

    const { error } = await supabase
      .from("kyc_cases")
      .update({ status: "withdrawn" })
      .eq("id", body.caseId);

    if (error) return errorResponse("update_failed", error.message, 500);

    return json({ caseId: body.caseId, status: "withdrawn" });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
