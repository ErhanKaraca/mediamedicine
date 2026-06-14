import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "kyc-delete-document" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST" && req.method !== "DELETE") {
    return errorResponse("method_not_allowed", "DELETE only", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as { caseId?: string; documentId?: string };
    if (!body.caseId || !body.documentId) {
      return errorResponse("invalid_body", "caseId and documentId required", 400);
    }

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, user_id, status")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }

    const { data: doc } = await supabase
      .from("kyc_documents")
      .select("id, status, case_id")
      .eq("id", body.documentId)
      .eq("case_id", body.caseId)
      .is("superseded_by", null)
      .single();

    if (!doc) return errorResponse("not_found", "Document not found", 404);

    const canDelete =
      kycCase.status === "draft" ||
      (kycCase.status === "resubmit_required" && doc.status === "rejected");

    if (!canDelete) {
      return errorResponse("invalid_state", "Document cannot be removed in current state", 409);
    }

    await supabase.from("kyc_documents").delete().eq("id", doc.id);

    return json({ deleted: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
