import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "mark-conversation-read" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { conversationId, profileId } = await req.json() as {
      conversationId?: string;
      profileId?: string;
    };

    if (!conversationId || !profileId) {
      return errorResponse("invalid_body", "conversationId and profileId required", 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("owner_user_id")
      .eq("id", profileId)
      .single();
    if (!profile || profile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("profile_id", profileId);

    if (error) return errorResponse("update_failed", error.message, 400);

    return json({ conversationId, profileId, readAt: new Date().toISOString() });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
