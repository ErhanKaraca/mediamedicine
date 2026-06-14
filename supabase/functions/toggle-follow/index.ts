import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { notifyProfileOwner } from "../_shared/notifications.ts";
import { FOLLOWABLE_KINDS } from "../_shared/social.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";

const log = createLogger({ fn: "toggle-follow" });

async function isBlockedPair(
  supabase: ReturnType<typeof createUserClient>,
  profileA: string,
  profileB: string,
): Promise<boolean> {
  const { data: forward } = await supabase
    .from("blocks")
    .select("blocker_profile_id")
    .eq("blocker_profile_id", profileA)
    .eq("blocked_profile_id", profileB)
    .limit(1);
  if (forward?.length) return true;

  const { data: reverse } = await supabase
    .from("blocks")
    .select("blocker_profile_id")
    .eq("blocker_profile_id", profileB)
    .eq("blocked_profile_id", profileA)
    .limit(1);
  return Boolean(reverse?.length);
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { followerProfileId, followingProfileId } = await req.json() as {
      followerProfileId?: string;
      followingProfileId?: string;
    };

    if (!followerProfileId || !followingProfileId) {
      return errorResponse("invalid_body", "followerProfileId and followingProfileId required", 400);
    }

    const invalidField = findInvalidUuidField({ followerProfileId, followingProfileId });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    if (followerProfileId === followingProfileId) {
      return errorResponse("invalid_body", "Cannot follow yourself", 400);
    }

    const ownsFollower = await isProfileOwnedByUser(supabase, followerProfileId, user.id);
    if (!ownsFollower) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const { data: target } = await supabase
      .from("profiles")
      .select("account_kind")
      .eq("id", followingProfileId)
      .single();

    if (!target || !FOLLOWABLE_KINDS.includes(target.account_kind as typeof FOLLOWABLE_KINDS[number])) {
      return errorResponse("invalid_target", "Only professional or page profiles can be followed", 400);
    }

    if (await isBlockedPair(supabase, followerProfileId, followingProfileId)) {
      return errorResponse("blocked", "Follow not allowed due to block", 403);
    }

    const { data: existing } = await supabase
      .from("follows")
      .select("follower_profile_id")
      .eq("follower_profile_id", followerProfileId)
      .eq("following_profile_id", followingProfileId)
      .maybeSingle();

    if (existing) {
      const { error: delErr } = await supabase
        .from("follows")
        .delete()
        .eq("follower_profile_id", followerProfileId)
        .eq("following_profile_id", followingProfileId);
      if (delErr) return errorResponse("delete_failed", delErr.message, 500);
      return json({ followerProfileId, followingProfileId, active: false });
    }

    const { error: insErr } = await supabase.from("follows").insert({
      follower_profile_id: followerProfileId,
      following_profile_id: followingProfileId,
    });
    if (insErr) return errorResponse("insert_failed", insErr.message, 400);

    const admin = createAdminClient();
    notifyProfileOwner(
      admin,
      followingProfileId,
      followerProfileId,
      "follow",
      "Yeni takipçiniz var",
    ).catch((e) => log.warn("notify failed", e));

    return json({ followerProfileId, followingProfileId, active: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
