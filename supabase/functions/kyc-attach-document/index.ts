import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "kyc-attach-document" });

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
      caseId?: string;
      documentType?: string;
      storagePath?: string;
      note?: string;
      mimeType?: string;
      fileSize?: number;
    };

    if (!body.caseId || !body.documentType || !body.storagePath) {
      return errorResponse("invalid_body", "caseId, documentType, storagePath required", 400);
    }

    if (!body.storagePath.startsWith(`${user.id}/`)) {
      return errorResponse("invalid_path", "Storage path must belong to user", 400);
    }

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, user_id, status, case_type")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }
    if (!["draft", "resubmit_required"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case is not editable", 409);
    }

    if (kycCase.status === "resubmit_required") {
      const { data: existing } = await supabase
        .from("kyc_documents")
        .select("id, status")
        .eq("case_id", body.caseId)
        .eq("document_type", body.documentType)
        .is("superseded_by", null)
        .maybeSingle();

      if (existing && existing.status !== "rejected") {
        return errorResponse("document_not_resubmit", "Only rejected document types can be replaced", 409);
      }
    }

    const { data: newDoc, error: insErr } = await supabase
      .from("kyc_documents")
      .insert({
        case_id: body.caseId,
        document_type: body.documentType,
        storage_path: body.storagePath,
        mime_type: body.mimeType ?? null,
        file_size: body.fileSize ?? null,
        user_note: body.note?.slice(0, 500) ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insErr || !newDoc) {
      const mapped = mapDbError(insErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    const { data: oldDocs } = await supabase
      .from("kyc_documents")
      .select("id")
      .eq("case_id", body.caseId)
      .eq("document_type", body.documentType)
      .is("superseded_by", null)
      .neq("id", newDoc.id);

    for (const old of oldDocs ?? []) {
      await supabase.from("kyc_documents").update({ superseded_by: newDoc.id }).eq("id", old.id);
    }

    return json({ documentId: newDoc.id, status: "pending" }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
