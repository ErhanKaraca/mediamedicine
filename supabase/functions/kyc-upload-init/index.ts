import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { KYC_ALLOWED_MIMES, KYC_MAX_BYTES } from "../_shared/kyc.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "kyc-upload-init" });
const BUCKET = "kyc-documents";

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
      mimeType?: string;
      fileSize?: number;
      originalName?: string;
    };

    if (!body.caseId || !body.documentType || !body.mimeType || !body.fileSize || !body.originalName) {
      return errorResponse("invalid_body", "Missing required fields", 400);
    }

    if (!KYC_ALLOWED_MIMES.includes(body.mimeType as typeof KYC_ALLOWED_MIMES[number])) {
      return errorResponse("unsupported_mime", "File type not allowed", 400);
    }
    if (body.fileSize > KYC_MAX_BYTES) {
      return errorResponse("file_too_large", "File exceeds 10MB limit", 400);
    }

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, status, user_id")
      .eq("id", body.caseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("forbidden", "Case not found", 403);
    }
    if (!["draft", "resubmit_required"].includes(kycCase.status)) {
      return errorResponse("invalid_state", "Case is not editable", 409);
    }

    const ext = body.originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${user.id}/${body.caseId}/${body.documentType}_${crypto.randomUUID()}.${ext}`;

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signErr || !signed) {
      log.error("signed url failed", signErr);
      return errorResponse("signed_url_failed", signErr?.message ?? "Could not create upload URL", 500);
    }

    return json({
      storagePath,
      signedUrl: signed.signedUrl,
      token: signed.token,
    });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
