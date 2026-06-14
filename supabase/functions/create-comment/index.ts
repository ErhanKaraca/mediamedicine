import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { COMMENT_MAX_DEPTH, POST_BODY_MAX_CHARS } from "../_shared/config.ts";
import { createLogger } from "../_shared/log.ts";
import { notifyPostAuthor, invokeEmitNotification, parseMentionSlugs } from "../_shared/notifications.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";
import { checkIdempotency, storeIdempotency } from "../_shared/audit.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "create-comment" });

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
      parentCommentId?: string | null;
      content?: Record<string, unknown>;
      contentPlain?: string | null;
      idempotencyKey?: string;
    };

    if (!body.postId || !body.authorProfileId) {
      return errorResponse("invalid_body", "postId and authorProfileId required", 400);
    }

    const invalid = findInvalidUuidField({
      postId: body.postId,
      authorProfileId: body.authorProfileId,
      parentCommentId: body.parentCommentId ?? undefined,
    });
    if (invalid) return errorResponse("invalid_uuid", `Invalid ${invalid}`, 400);

    const owns = await isProfileOwnedByUser(supabase, body.authorProfileId, user.id);
    if (!owns) return errorResponse("forbidden", "Not your profile", 403);

    const admin = createAdminClient();
    const cached = await checkIdempotency(admin, user.id, "comment", body.idempotencyKey);
    if (cached.hit) return json(cached.response, { status: 201 });

    if (body.contentPlain && body.contentPlain.length > POST_BODY_MAX_CHARS) {
      return errorResponse("content_too_long", `Max ${POST_BODY_MAX_CHARS} chars`, 400);
    }

    if (body.parentCommentId) {
      const { data: parent } = await supabase
        .from("comments")
        .select("thread_depth")
        .eq("id", body.parentCommentId)
        .single();
      if (!parent) return errorResponse("parent_not_found", "Parent comment not found", 404);
      if (parent.thread_depth >= COMMENT_MAX_DEPTH) {
        return errorResponse("max_depth", "Max comment depth exceeded", 400);
      }
    }

    const { data: comment, error: insertErr } = await supabase.from("comments").insert({
      post_id: body.postId,
      author_profile_id: body.authorProfileId,
      actor_user_id: user.id,
      parent_comment_id: body.parentCommentId ?? null,
      content: body.content ?? {},
      content_plain: body.contentPlain ?? null,
    }).select("id").single();

    if (insertErr || !comment) {
      const mapped = mapDbError(insertErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    notifyPostAuthor(
      admin,
      body.postId,
      body.authorProfileId,
      "comment",
      "Gönderinize yeni yorum",
      body.contentPlain?.slice(0, 120) ?? undefined,
    ).catch((e) => log.warn("notify failed", e));

    const mentionSlugs = parseMentionSlugs(body.contentPlain);
    if (mentionSlugs.length > 0) {
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
          entityType: "comment",
          entityId: comment.id,
          title: "Bir yorumda bahsedildiniz",
          body: body.contentPlain?.slice(0, 120),
        }).catch((e) => log.warn("mention notify failed", e));
      }
    }

    const response = { commentId: comment.id };
    await storeIdempotency(admin, user.id, "comment", body.idempotencyKey, response);
    return json(response, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
