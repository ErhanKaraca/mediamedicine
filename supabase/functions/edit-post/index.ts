import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { POST_BODY_MAX_CHARS } from "../_shared/config.ts";
import { createLogger } from "../_shared/log.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { mapDbError } from "../_shared/db-error.ts";
import { invokeEmitNotification, parseMentionSlugs } from "../_shared/notifications.ts";

const log = createLogger({ fn: "edit-post" });

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
      postId?: string;
      authorProfileId?: string;
      content?: Record<string, unknown>;
      contentPlain?: string | null;
    };

    if (!body.postId || !body.authorProfileId) {
      return errorResponse("invalid_body", "postId and authorProfileId required", 400);
    }

    const invalid = findInvalidUuidField({ postId: body.postId, authorProfileId: body.authorProfileId });
    if (invalid) return errorResponse("invalid_uuid", `Invalid ${invalid}`, 400);

    if (body.contentPlain && body.contentPlain.length > POST_BODY_MAX_CHARS) {
      return errorResponse("content_too_long", `Max ${POST_BODY_MAX_CHARS} chars`, 400);
    }

    const { data: existing } = await supabase
      .from("posts")
      .select("id, author_profile_id, actor_user_id, deleted_at, status")
      .eq("id", body.postId)
      .single();

    if (!existing || existing.deleted_at) {
      return errorResponse("not_found", "Post not found", 404);
    }
    if (existing.author_profile_id !== body.authorProfileId) {
      return errorResponse("forbidden", "Author mismatch", 403);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("owner_user_id, display_name")
      .eq("id", body.authorProfileId)
      .single();

    if (!profile || profile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const { error: updateErr } = await supabase
      .from("posts")
      .update({
        content: body.content ?? {},
        content_plain: body.contentPlain ?? null,
        edited_at: new Date().toISOString(),
      })
      .eq("id", body.postId);

    if (updateErr) {
      const mapped = mapDbError(updateErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    const mentionSlugs = parseMentionSlugs(body.contentPlain);
    if (mentionSlugs.length > 0) {
      const admin = createAdminClient();
      const { data: mentioned } = await admin
        .from("profiles")
        .select("id, slug, owner_user_id")
        .in("slug", mentionSlugs);
      for (const m of mentioned ?? []) {
        if (m.id === body.authorProfileId || !m.owner_user_id) continue;
        invokeEmitNotification({
          recipientUserId: m.owner_user_id,
          recipientProfileId: m.id,
          actorProfileId: body.authorProfileId,
          eventType: "mention",
          entityType: "post",
          entityId: body.postId,
          title: "Bir gönderide bahsedildiniz",
          body: body.contentPlain?.slice(0, 120),
        }).catch((e) => log.warn("mention notify failed", e));
      }
    }

    return json({ postId: body.postId, edited: true });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
