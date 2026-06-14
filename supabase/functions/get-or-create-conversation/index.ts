import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { canMessageProfiles, getOrCreateDirectConversation } from "../_shared/messaging.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";

const log = createLogger({ fn: "get-or-create-conversation" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { myProfileId, otherProfileId } = await req.json() as {
      myProfileId?: string;
      otherProfileId?: string;
    };

    if (!myProfileId || !otherProfileId) {
      return errorResponse("invalid_body", "myProfileId and otherProfileId required", 400);
    }

    const invalidField = findInvalidUuidField({ myProfileId, otherProfileId });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    const ownsProfile = await isProfileOwnedByUser(supabase, myProfileId, user.id);
    if (!ownsProfile) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const admin = createAdminClient();
    const allowed = await canMessageProfiles(admin, myProfileId, otherProfileId);
    if (!allowed) {
      return errorResponse("messaging_not_allowed", "Cannot message this profile", 403);
    }

    const result = await getOrCreateDirectConversation(admin, myProfileId, otherProfileId);
    if (!result) {
      return errorResponse("insert_failed", "Could not create conversation", 500);
    }

    return json({ conversationId: result.conversationId, created: result.created });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
