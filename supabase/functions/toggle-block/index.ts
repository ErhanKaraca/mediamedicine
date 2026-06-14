import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";

const log = createLogger({ fn: "toggle-block" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { blockerProfileId, blockedProfileId, removeFollows = true } = await req.json() as {
      blockerProfileId?: string;
      blockedProfileId?: string;
      removeFollows?: boolean;
    };

    if (!blockerProfileId || !blockedProfileId) {
      return errorResponse("invalid_body", "blockerProfileId and blockedProfileId required", 400);
    }

    const invalidField = findInvalidUuidField({ blockerProfileId, blockedProfileId });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    if (blockerProfileId === blockedProfileId) {
      return errorResponse("invalid_body", "Cannot block yourself", 400);
    }

    const ownsBlocker = await isProfileOwnedByUser(supabase, blockerProfileId, user.id);
    if (!ownsBlocker) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const { data: existing } = await supabase
      .from("blocks")
      .select("blocker_profile_id")
      .eq("blocker_profile_id", blockerProfileId)
      .eq("blocked_profile_id", blockedProfileId)
      .maybeSingle();

    if (existing) {
      const { error: delErr } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_profile_id", blockerProfileId)
        .eq("blocked_profile_id", blockedProfileId);
      if (delErr) return errorResponse("delete_failed", delErr.message, 500);
      return json({ blockerProfileId, blockedProfileId, active: false });
    }

    const { error: insErr } = await supabase.from("blocks").insert({
      blocker_profile_id: blockerProfileId,
      blocked_profile_id: blockedProfileId,
    });
    if (insErr) return errorResponse("insert_failed", insErr.message, 400);

    if (removeFollows) {
      await supabase.from("follows").delete()
        .eq("follower_profile_id", blockerProfileId)
        .eq("following_profile_id", blockedProfileId);
      await supabase.from("follows").delete()
        .eq("follower_profile_id", blockedProfileId)
        .eq("following_profile_id", blockerProfileId);
    }

    return json({ blockerProfileId, blockedProfileId, active: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
