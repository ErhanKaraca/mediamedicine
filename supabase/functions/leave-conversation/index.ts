import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";

const log = createLogger({ fn: "leave-conversation" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as { conversationId?: string; profileId?: string };
    if (!body.conversationId || !body.profileId) {
      return errorResponse("invalid_body", "conversationId and profileId required", 400);
    }

    const invalid = findInvalidUuidField({
      conversationId: body.conversationId,
      profileId: body.profileId,
    });
    if (invalid) return errorResponse("invalid_uuid", `Invalid ${invalid}`, 400);

    const owns = await isProfileOwnedByUser(supabase, body.profileId, user.id);
    if (!owns) return errorResponse("forbidden", "Not your profile", 403);

    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", body.conversationId)
      .eq("profile_id", body.profileId);

    if (error) return errorResponse("delete_failed", error.message, 400);

    return json({ conversationId: body.conversationId, profileId: body.profileId, left: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
