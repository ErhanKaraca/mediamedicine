import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "delete-message" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { messageId } = await req.json() as { messageId?: string };
    if (!messageId) return errorResponse("invalid_body", "messageId required", 400);

    const { data: msg } = await supabase
      .from("messages")
      .select("id, actor_user_id, deleted_at")
      .eq("id", messageId)
      .single();

    if (!msg || msg.deleted_at) return errorResponse("not_found", "Message not found", 404);
    if (msg.actor_user_id !== user.id) return errorResponse("forbidden", "Not your message", 403);

    const { error } = await supabase.from("messages").update({
      deleted_at: new Date().toISOString(),
      content_plain: null,
      content: {},
    }).eq("id", messageId);

    if (error) return errorResponse("update_failed", error.message, 400);

    return json({ messageId, deleted: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
