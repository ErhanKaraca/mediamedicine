import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "kyc-create-case" });

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
      caseType?: string;
      profileId?: string;
      payload?: Record<string, unknown>;
    };

    if (!body.caseType) return errorResponse("invalid_body", "caseType required", 400);

    const { data: caseType } = await supabase
      .from("kyc_case_types")
      .select("code, version, target_entity_type")
      .eq("code", body.caseType)
      .eq("is_current", true)
      .single();

    if (!caseType) return errorResponse("unknown_case_type", "Case type not found", 400);

    let profileId = body.profileId;
    if (caseType.target_entity_type === "profile") {
      if (!profileId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, account_kind, owner_user_id")
          .eq("owner_user_id", user.id)
          .eq("account_kind", "user")
          .is("deleted_at", null)
          .maybeSingle();
        if (!profile) return errorResponse("profile_not_found", "User profile required", 400);
        profileId = profile.id;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("owner_user_id, account_kind")
          .eq("id", profileId)
          .single();
        if (!profile || profile.owner_user_id !== user.id) {
          return errorResponse("forbidden", "Not your profile", 403);
        }
        if (profile.account_kind !== "user") {
          return errorResponse("invalid_profile", "Only user profiles can start professional KYC", 400);
        }
      }
    }

    const { data: kycCase, error: insErr } = await supabase
      .from("kyc_cases")
      .insert({
        user_id: user.id,
        profile_id: profileId ?? null,
        case_type: caseType.code,
        case_type_version: caseType.version,
        target_entity_type: caseType.target_entity_type,
        payload: body.payload ?? {},
        status: "draft",
      })
      .select("id, case_type, case_type_version, target_entity_type, status, payload, created_at")
      .single();

    if (insErr || !kycCase) {
      const mapped = mapDbError(insErr);
      if (mapped.code === "duplicate") {
        return errorResponse("active_case_exists", "An active case already exists for this type", 409);
      }
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    return json({
      id: kycCase.id,
      caseType: kycCase.case_type,
      caseTypeVersion: kycCase.case_type_version,
      targetEntityType: kycCase.target_entity_type,
      status: kycCase.status,
      payload: kycCase.payload,
      createdAt: kycCase.created_at,
    }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
