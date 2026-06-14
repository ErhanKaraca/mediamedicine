import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { createAdminClient } from "./auth.ts";
import { createLogger } from "./log.ts";
import { logNotificationFailure } from "./audit.ts";

const log = createLogger({ fn: "notifications-helper" });

export interface EmitNotificationPayload {
  recipientUserId: string;
  recipientProfileId?: string | null;
  actorProfileId?: string | null;
  eventType: string;
  entityType?: string;
  entityId?: string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  channels?: string[];
}

export async function invokeEmitNotification(payload: EmitNotificationPayload): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    log.warn("emit skip: missing env");
    return;
  }

  try {
    const res = await fetch(`${url}/functions/v1/emit-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      log.warn("emit failed", text);
      try {
        const admin = createAdminClient();
        await logNotificationFailure(admin, payload as Record<string, unknown>, text);
      } catch (auditErr) {
        log.warn("audit log failed", auditErr);
      }
    }
  } catch (e) {
    log.warn("emit error", e);
    try {
      const admin = createAdminClient();
      await logNotificationFailure(admin, payload as Record<string, unknown>, String(e));
    } catch (auditErr) {
      log.warn("audit log failed", auditErr);
    }
  }
}

export async function notifyPostAuthor(
  admin: SupabaseClient,
  postId: string,
  actorProfileId: string,
  eventType: "like" | "comment" | "repost" | "mention",
  title: string,
  body?: string,
): Promise<void> {
  const { data: post } = await admin
    .from("posts")
    .select("author_profile_id")
    .eq("id", postId)
    .single();
  if (!post) return;
  if (post.author_profile_id === actorProfileId) return;

  const { data: author } = await admin
    .from("profiles")
    .select("owner_user_id, display_name")
    .eq("id", post.author_profile_id)
    .single();
  if (!author?.owner_user_id) return;

  const { data: actor } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", actorProfileId)
    .maybeSingle();

  await invokeEmitNotification({
    recipientUserId: author.owner_user_id,
    recipientProfileId: post.author_profile_id,
    actorProfileId,
    eventType,
    entityType: "post",
    entityId: postId,
    title,
    body,
    payload: { actorName: actor?.display_name ?? "Someone", deepLink: `/post/${postId}` },
  });
}

export async function notifyProfileOwner(
  admin: SupabaseClient,
  targetProfileId: string,
  actorProfileId: string,
  eventType: string,
  title: string,
  body?: string,
  entityType?: string,
  entityId?: string,
): Promise<void> {
  const { data: target } = await admin
    .from("profiles")
    .select("owner_user_id")
    .eq("id", targetProfileId)
    .single();
  if (!target?.owner_user_id) return;

  const { data: actor } = await admin
    .from("profiles")
    .select("display_name, owner_user_id")
    .eq("id", actorProfileId)
    .maybeSingle();
  if (actor?.owner_user_id === target.owner_user_id) return;

  await invokeEmitNotification({
    recipientUserId: target.owner_user_id,
    recipientProfileId: targetProfileId,
    actorProfileId,
    eventType,
    entityType,
    entityId,
    title,
    body,
    payload: { actorName: actor?.display_name ?? "Someone" },
  });
}

export function parseMentionSlugs(contentPlain: string | null | undefined): string[] {
  if (!contentPlain) return [];
  const matches = contentPlain.match(/@([a-zA-Z0-9_-]{3,40})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
