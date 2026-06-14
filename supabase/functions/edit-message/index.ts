import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { MESSAGE_EDIT_WINDOW_MS, MESSAGE_MAX_PLAIN_CHARS } from "../_shared/messaging.ts";

const log = createLogger({ fn: "edit-message" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { messageId, content, contentPlain } = await req.json() as {
      messageId?: string;
      content?: Record<string, unknown>;
      contentPlain?: string;
    };

    if (!messageId || !contentPlain?.trim()) {
      return errorResponse("invalid_body", "messageId and contentPlain required", 400);
    }
    if (contentPlain.length > MESSAGE_MAX_PLAIN_CHARS) {
      return errorResponse("content_too_long", `Max ${MESSAGE_MAX_PLAIN_CHARS} chars`, 400);
    }

    const { data: msg } = await supabase
      .from("messages")
      .select("id, sender_profile_id, actor_user_id, created_at, deleted_at")
      .eq("id", messageId)
      .single();

    if (!msg || msg.deleted_at) return errorResponse("not_found", "Message not found", 404);
    if (msg.actor_user_id !== user.id) return errorResponse("forbidden", "Not your message", 403);

    const age = Date.now() - new Date(msg.created_at).getTime();
    if (age > MESSAGE_EDIT_WINDOW_MS) {
      return errorResponse("edit_window_expired", "Edit window expired", 403);
    }

    const { error } = await supabase.from("messages").update({
      content: content ?? {},
      content_plain: contentPlain,
      edited_at: new Date().toISOString(),
    }).eq("id", messageId);

    if (error) return errorResponse("update_failed", error.message, 400);

    return json({ messageId, edited: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
