import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { MESSAGE_MAX_PLAIN_CHARS } from "../_shared/messaging.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";
import { checkIdempotency, storeIdempotency } from "../_shared/audit.ts";
import { mapDbError } from "../_shared/db-error.ts";

const log = createLogger({ fn: "send-message" });

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
      conversationId?: string;
      senderProfileId?: string;
      content?: Record<string, unknown>;
      contentPlain?: string | null;
      mediaIds?: string[];
      attachments?: unknown[];
      idempotencyKey?: string;
    };

    if (!body.conversationId || !body.senderProfileId) {
      return errorResponse("invalid_body", "conversationId and senderProfileId required", 400);
    }

    const invalidField = findInvalidUuidField({
      conversationId: body.conversationId,
      senderProfileId: body.senderProfileId,
    });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    const mediaIds = body.mediaIds ?? [];
    const hasLegacyAttachments = body.attachments && body.attachments.length > 0;
    if (!body.contentPlain?.trim() && mediaIds.length === 0 && !hasLegacyAttachments) {
      return errorResponse("invalid_body", "Message content or media required", 400);
    }
    if (body.contentPlain && body.contentPlain.length > MESSAGE_MAX_PLAIN_CHARS) {
      return errorResponse("content_too_long", `Max ${MESSAGE_MAX_PLAIN_CHARS} chars`, 400);
    }

    const ownsSender = await isProfileOwnedByUser(supabase, body.senderProfileId, user.id);
    if (!ownsSender) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    const admin = createAdminClient();
    const cached = await checkIdempotency(admin, user.id, "message", body.idempotencyKey);
    if (cached.hit) return json(cached.response, { status: 201 });

    const attachmentPayload = mediaIds.length > 0
      ? mediaIds.map((id) => ({ mediaId: id }))
      : (body.attachments ?? []);

    const { data: msg, error: insErr } = await supabase.from("messages").insert({
      conversation_id: body.conversationId,
      sender_profile_id: body.senderProfileId,
      actor_user_id: user.id,
      content: body.content ?? {},
      content_plain: body.contentPlain ?? null,
      attachments: attachmentPayload,
    }).select("id, created_at").single();

    if (insErr || !msg) {
      const mapped = mapDbError(insErr);
      return errorResponse(mapped.code, mapped.message, mapped.status);
    }

    if (mediaIds.length > 0) {
      const mmRows = mediaIds.map((mediaId, index) => ({
        message_id: msg.id,
        media_id: mediaId,
        position: index,
      }));
      const { error: mmErr } = await admin.from("message_media").insert(mmRows);
      if (mmErr) log.warn("message_media insert failed", mmErr);
    }

    const { data: sender } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", body.senderProfileId)
      .single();

    const { error: convErr } = await supabase.from("conversations").update({
      updated_at: new Date().toISOString(),
    }).eq("id", body.conversationId);
    if (convErr) log.warn("conversation updated_at failed", convErr);

    const { data: participants } = await admin
      .from("conversation_participants")
      .select("profile_id")
      .eq("conversation_id", body.conversationId)
      .neq("profile_id", body.senderProfileId);

    for (const p of participants ?? []) {
      const { data: recipient } = await admin
        .from("profiles")
        .select("owner_user_id")
        .eq("id", p.profile_id)
        .single();
      if (!recipient?.owner_user_id) continue;
      invokeEmitNotification({
        recipientUserId: recipient.owner_user_id,
        recipientProfileId: p.profile_id,
        actorProfileId: body.senderProfileId,
        eventType: "message",
        entityType: "conversation",
        entityId: body.conversationId,
        title: "Yeni mesaj",
        body: body.contentPlain?.slice(0, 120) ?? "Medya gönderildi",
        payload: { actorName: sender?.display_name ?? "Someone", messageId: msg.id },
      }).catch((e) => log.warn("notify failed", e));
    }

    const response = { messageId: msg.id, createdAt: msg.created_at };
    await storeIdempotency(admin, user.id, "message", body.idempotencyKey, response);
    return json(response, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
