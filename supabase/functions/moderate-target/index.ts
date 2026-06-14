import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { assertPlatformStaff } from "../_shared/staff.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { captureTargetSnapshot, logAdminAction } from "../_shared/audit.ts";

const log = createLogger({ fn: "moderate-target" });

const VALID_ACTIONS = ["hide", "remove", "warn", "ban", "restore"] as const;
const AUTH_BAN_DURATION = "876000h";

async function notifyProfileOwner(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  action: string,
  reason?: string,
): Promise<void> {
  const { data: profile } = await admin
    .from("profiles")
    .select("owner_user_id")
    .eq("id", profileId)
    .single();
  if (!profile?.owner_user_id) return;

  invokeEmitNotification({
    recipientUserId: profile.owner_user_id,
    recipientProfileId: profileId,
    eventType: "moderation_action",
    entityType: "profile",
    entityId: profileId,
    title: "Moderasyon işlemi uygulandı",
    body: reason ?? action,
  }).catch((e) => log.warn("notify failed", e));
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

    const admin = createAdminClient();
    const staff = await assertPlatformStaff(admin, user.id);
    if (!staff) return errorResponse("forbidden", "Platform staff required", 403);

    const body = await req.json() as {
      targetType?: string;
      targetId?: string;
      action?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.targetType || !body.targetId || !body.action) {
      return errorResponse("invalid_body", "targetType, targetId, action required", 400);
    }
    if (!VALID_ACTIONS.includes(body.action as typeof VALID_ACTIONS[number])) {
      return errorResponse("invalid_action", "Unknown action", 400);
    }

    const invalidField = findInvalidUuidField({ targetId: body.targetId });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    const targetSnapshot = await captureTargetSnapshot(admin, body.targetType, body.targetId);

    const { data: modAction, error: modErr } = await admin.from("moderation_actions").insert({
      moderator_user_id: user.id,
      target_type: body.targetType,
      target_id: body.targetId,
      action: body.action,
      reason: body.reason ?? null,
      metadata: body.metadata ?? {},
      target_snapshot: targetSnapshot,
    }).select("id").single();

    if (modErr || !modAction) return errorResponse("insert_failed", modErr?.message ?? "Failed", 500);

    if (body.targetType === "post") {
      const updates: Record<string, unknown> = {};
      if (body.action === "hide") updates.moderation_state = "hidden";
      if (body.action === "remove" || body.action === "ban") {
        updates.moderation_state = "removed";
        updates.deleted_at = new Date().toISOString();
      }
      if (body.action === "restore") {
        updates.moderation_state = "none";
        updates.deleted_at = null;
      }
      if (Object.keys(updates).length) {
        await admin.from("posts").update(updates).eq("id", body.targetId);
      }

      const { data: post } = await admin
        .from("posts")
        .select("author_profile_id")
        .eq("id", body.targetId)
        .single();
      if (post) {
        const { data: author } = await admin
          .from("profiles")
          .select("owner_user_id")
          .eq("id", post.author_profile_id)
          .single();
        if (author?.owner_user_id) {
          invokeEmitNotification({
            recipientUserId: author.owner_user_id,
            recipientProfileId: post.author_profile_id,
            eventType: "moderation_action",
            entityType: "post",
            entityId: body.targetId,
            title: "Moderasyon işlemi uygulandı",
            body: body.reason ?? body.action,
          }).catch((e) => log.warn("notify failed", e));
        }
      }
    }

    if (body.targetType === "comment") {
      if (body.action === "hide") {
        await admin.from("comments").update({ moderation_state: "hidden" }).eq("id", body.targetId);
      }
      if (body.action === "remove" || body.action === "ban") {
        await admin.from("comments").update({
          moderation_state: "removed",
          deleted_at: new Date().toISOString(),
        }).eq("id", body.targetId);
      }
      if (body.action === "restore") {
        await admin.from("comments").update({
          moderation_state: "none",
          deleted_at: null,
        }).eq("id", body.targetId);
      }
    }

    if (body.targetType === "profile") {
      const now = new Date().toISOString();
      if (body.action === "hide") {
        const { data: existing } = await admin
          .from("profiles")
          .select("visibility_settings")
          .eq("id", body.targetId)
          .single();
        const settings = (existing?.visibility_settings as Record<string, unknown>) ?? {};
        await admin.from("profiles").update({
          visibility_settings: { ...settings, moderated_hidden: true },
        }).eq("id", body.targetId);
      }
      if (body.action === "ban" || body.action === "remove") {
        await admin.from("profiles").update({ deleted_at: now }).eq("id", body.targetId);
      }
      if (body.action === "restore") {
        const { data: existing } = await admin
          .from("profiles")
          .select("visibility_settings")
          .eq("id", body.targetId)
          .single();
        const settings = { ...((existing?.visibility_settings as Record<string, unknown>) ?? {}) };
        delete settings.moderated_hidden;
        await admin.from("profiles").update({
          deleted_at: null,
          visibility_settings: settings,
        }).eq("id", body.targetId);
      }
      if (body.action !== "restore") {
        await notifyProfileOwner(admin, body.targetId, body.action, body.reason);
      }
    }

    if (body.targetType === "user") {
      if (body.action === "ban" || body.action === "remove") {
        const { error: banErr } = await admin.auth.admin.updateUserById(body.targetId, {
          ban_duration: AUTH_BAN_DURATION,
        });
        if (banErr) {
          log.error("auth ban failed", banErr);
          return errorResponse("ban_failed", banErr.message, 400);
        }
        await admin.from("profiles").update({
          deleted_at: new Date().toISOString(),
        }).eq("owner_user_id", body.targetId);
      }
      if (body.action === "restore") {
        const { error: unbanErr } = await admin.auth.admin.updateUserById(body.targetId, {
          ban_duration: "none",
        });
        if (unbanErr) {
          log.error("auth unban failed", unbanErr);
          return errorResponse("restore_failed", unbanErr.message, 400);
        }
        await admin.from("profiles").update({
          deleted_at: null,
        }).eq("owner_user_id", body.targetId);
      }
    }

    await logAdminAction(admin, user.id, `moderate_${body.action}`, body.targetType, body.targetId, {
      moderationActionId: modAction.id,
      reason: body.reason ?? null,
    });

    return json({ moderationActionId: modAction.id, action: body.action });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
