import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { notifyPostAuthor } from "../_shared/notifications.ts";

const log = createLogger({ fn: "toggle-reaction" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { postId, profileId, type = "like" } = await req.json() as {
      postId?: string;
      profileId?: string;
      type?: string;
    };

    if (!postId || !profileId) {
      return errorResponse("invalid_body", "postId and profileId required", 400);
    }

    const { data: existing } = await supabase
      .from("reactions")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("post_id", postId)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      const { error: delErr } = await supabase
        .from("reactions")
        .delete()
        .eq("profile_id", profileId)
        .eq("post_id", postId)
        .eq("type", type);
      if (delErr) return errorResponse("delete_failed", delErr.message, 500);
      return json({ postId, profileId, type, active: false });
    }

    const { error: insErr } = await supabase.from("reactions").insert({
      profile_id: profileId,
      post_id: postId,
      type,
    });
    if (insErr) {
      log.error("insert failed", insErr);
      return errorResponse("insert_failed", insErr.message, 400);
    }

    const admin = createAdminClient();
    notifyPostAuthor(admin, postId, profileId, "like", "Gönderiniz beğenildi").catch((e) =>
      log.warn("notify failed", e)
    );

    return json({ postId, profileId, type, active: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
