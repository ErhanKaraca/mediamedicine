import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "create-page" });

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
      slug?: string;
      displayName?: string;
      bio?: string;
      ownerProfileId?: string;
      visibility?: "public" | "private";
      kycCaseId?: string;
    };

    if (!body.slug || !body.displayName || !body.ownerProfileId || !body.kycCaseId) {
      return errorResponse(
        "invalid_body",
        "slug, displayName, ownerProfileId, kycCaseId required",
        400,
      );
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("owner_user_id, account_kind")
      .eq("id", body.ownerProfileId)
      .single();

    if (!ownerProfile || ownerProfile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    if (ownerProfile.account_kind !== "professional") {
      return errorResponse("professional_required", "Page owner must be a verified professional", 403);
    }

    const { data: kycCase } = await supabase
      .from("kyc_cases")
      .select("id, user_id, case_type, target_entity_type, status, payload")
      .eq("id", body.kycCaseId)
      .single();

    if (!kycCase || kycCase.user_id !== user.id) {
      return errorResponse("kyc_not_found", "KYC case not found", 404);
    }
    if (
      kycCase.case_type !== "healthcare_institution" ||
      kycCase.target_entity_type !== "page" ||
      kycCase.status !== "approved"
    ) {
      return errorResponse("kyc_not_approved", "Approved institution KYC case required", 403);
    }

    const intendedSlug = (kycCase.payload as Record<string, unknown>)?.intendedSlug as string | undefined;
    if (intendedSlug && intendedSlug.toLowerCase() !== body.slug.toLowerCase()) {
      return errorResponse("slug_mismatch", "Slug does not match approved KYC case", 409);
    }

    const admin = createAdminClient();

    const { data: pageProfile, error: profileErr } = await admin
      .from("profiles")
      .insert({
        account_kind: "page",
        slug: body.slug.toLowerCase(),
        display_name: body.displayName,
        bio: body.bio ?? null,
        owner_user_id: null,
      })
      .select("id")
      .single();

    if (profileErr || !pageProfile) {
      const mapped = mapDbError(profileErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    const { data: page, error: pageErr } = await admin
      .from("pages")
      .insert({
        profile_id: pageProfile.id,
        created_by_user_id: user.id,
        visibility: body.visibility ?? "public",
        kyc_case_id: body.kycCaseId,
      })
      .select("id")
      .single();

    if (pageErr || !page) {
      await admin.from("profiles").delete().eq("id", pageProfile.id);
      const mapped = mapDbError(pageErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    const { error: memberErr } = await admin.from("page_members").insert({
      page_id: page.id,
      profile_id: body.ownerProfileId,
      role: "owner",
      status: "active",
    });

    if (memberErr) {
      await admin.from("pages").delete().eq("id", page.id);
      await admin.from("profiles").delete().eq("id", pageProfile.id);
      return errorResponse("member_failed", memberErr.message, 400);
    }

    return json({
      pageId: page.id,
      profileId: pageProfile.id,
      slug: body.slug,
      kycCaseId: body.kycCaseId,
    }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
