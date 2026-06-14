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
    };

    if (!body.slug || !body.displayName || !body.ownerProfileId) {
      return errorResponse("invalid_body", "slug, displayName, ownerProfileId required", 400);
    }

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("owner_user_id, account_kind")
      .eq("id", body.ownerProfileId)
      .single();

    if (!ownerProfile || ownerProfile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    if (!["user", "professional"].includes(ownerProfile.account_kind)) {
      return errorResponse("invalid_owner", "Page owner must be user or professional profile", 400);
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
    }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
