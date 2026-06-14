import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { invokeEmitNotification } from "../_shared/notifications.ts";
import { GROUP_ADMIN_ROLES, type GroupMemberAction } from "../_shared/social.ts";
import { findInvalidUuidField } from "../_shared/uuid.ts";
import { isProfileOwnedByUser } from "../_shared/profile-ownership.ts";

const log = createLogger({ fn: "manage-group-membership" });

const VALID_ACTIONS: GroupMemberAction[] = [
  "join", "leave", "request", "approve", "reject", "ban",
];

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
      action?: GroupMemberAction;
      groupId?: string;
      profileId?: string;
      targetProfileId?: string;
      reason?: string;
    };

    if (!body.action || !body.groupId || !body.profileId) {
      return errorResponse("invalid_body", "action, groupId, profileId required", 400);
    }
    if (!VALID_ACTIONS.includes(body.action)) {
      return errorResponse("invalid_action", "Unknown action", 400);
    }

    const invalidField = findInvalidUuidField({
      groupId: body.groupId,
      profileId: body.profileId,
      targetProfileId: body.targetProfileId,
    });
    if (invalidField) {
      return errorResponse("invalid_uuid", `Invalid ${invalidField}`, 400);
    }

    const { data: group } = await supabase
      .from("groups")
      .select("id, join_policy, name")
      .eq("id", body.groupId)
      .single();
    if (!group) return errorResponse("group_not_found", "Group not found", 404);

    const admin = createAdminClient();

    const selfActions = ["join", "leave", "request"] as const;
    if (selfActions.includes(body.action as typeof selfActions[number])) {
      const ownsProfile = await isProfileOwnedByUser(supabase, body.profileId, user.id);
      if (!ownsProfile) {
        return errorResponse("forbidden", "Not your profile", 403);
      }
    }

    if (body.action === "join") {
      if (group.join_policy === "invite_only") {
        return errorResponse("invite_only", "Group is invite only", 403);
      }
      const status = group.join_policy === "open" ? "active" : "pending";
      const { error } = await admin.from("group_members").upsert({
        group_id: body.groupId,
        profile_id: body.profileId,
        role: "member",
        status,
      });
      if (error) return errorResponse("upsert_failed", error.message, 400);

      if (status === "pending") {
        const { data: admins } = await supabase
          .from("group_members")
          .select("profile_id")
          .eq("group_id", body.groupId)
          .in("role", GROUP_ADMIN_ROLES)
          .eq("status", "active");
        for (const a of admins ?? []) {
          const { data: prof } = await admin.from("profiles").select("owner_user_id").eq("id", a.profile_id).single();
          if (prof?.owner_user_id) {
            invokeEmitNotification({
              recipientUserId: prof.owner_user_id,
              recipientProfileId: a.profile_id,
              actorProfileId: body.profileId,
              eventType: "group_join_request",
              entityType: "group",
              entityId: body.groupId,
              title: `${group.name} grubuna katılım isteği`,
            }).catch((e) => log.warn("notify failed", e));
          }
        }
      }
      return json({ groupId: body.groupId, profileId: body.profileId, status });
    }

    if (body.action === "leave") {
      const { error } = await admin.from("group_members").delete()
        .eq("group_id", body.groupId)
        .eq("profile_id", body.profileId);
      if (error) return errorResponse("delete_failed", error.message, 400);
      return json({ groupId: body.groupId, profileId: body.profileId, status: "left" });
    }

    if (body.action === "request") {
      if (group.join_policy !== "request") {
        return errorResponse("invalid_action", "Group does not accept requests", 400);
      }
      const { error } = await admin.from("group_members").upsert({
        group_id: body.groupId,
        profile_id: body.profileId,
        role: "member",
        status: "pending",
      });
      if (error) return errorResponse("upsert_failed", error.message, 400);
      return json({ groupId: body.groupId, profileId: body.profileId, status: "pending" });
    }

    const targetId = body.targetProfileId ?? body.profileId;
    const { data: actorMember } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", body.groupId)
      .eq("profile_id", body.profileId)
      .eq("status", "active")
      .maybeSingle();

    if (!actorMember || !GROUP_ADMIN_ROLES.includes(actorMember.role as typeof GROUP_ADMIN_ROLES[number])) {
      return errorResponse("forbidden", "Admin role required", 403);
    }

    if (body.action === "approve") {
      const { error } = await admin.from("group_members").update({ status: "active" })
        .eq("group_id", body.groupId)
        .eq("profile_id", targetId);
      if (error) return errorResponse("update_failed", error.message, 400);

      const { data: targetProf } = await admin.from("profiles").select("owner_user_id").eq("id", targetId).single();
      if (targetProf?.owner_user_id) {
        invokeEmitNotification({
          recipientUserId: targetProf.owner_user_id,
          recipientProfileId: targetId,
          actorProfileId: body.profileId,
          eventType: "group_join_approved",
          entityType: "group",
          entityId: body.groupId,
          title: `${group.name} grubuna kabul edildiniz`,
        }).catch((e) => log.warn("notify failed", e));
      }
      return json({ groupId: body.groupId, profileId: targetId, status: "active" });
    }

    if (body.action === "reject") {
      const { error } = await admin.from("group_members").delete()
        .eq("group_id", body.groupId)
        .eq("profile_id", targetId)
        .eq("status", "pending");
      if (error) return errorResponse("delete_failed", error.message, 400);
      return json({ groupId: body.groupId, profileId: targetId, status: "rejected" });
    }

    if (body.action === "ban") {
      const { error } = await admin.from("group_members").upsert({
        group_id: body.groupId,
        profile_id: targetId,
        role: "member",
        status: "banned",
        banned_reason: body.reason ?? null,
      });
      if (error) return errorResponse("upsert_failed", error.message, 400);
      return json({ groupId: body.groupId, profileId: targetId, status: "banned" });
    }

    return errorResponse("invalid_action", "Unhandled action", 400);
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
