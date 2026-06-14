import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function checkIdempotency(
  admin: SupabaseClient,
  userId: string,
  resourceType: string,
  key: string | undefined,
): Promise<{ hit: true; response: Record<string, unknown> } | { hit: false }> {
  if (!key) return { hit: false };

  const fullKey = `${resourceType}:${userId}:${key}`;
  const { data } = await admin
    .from("idempotency_keys")
    .select("response")
    .eq("key", fullKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (data?.response) {
    return { hit: true, response: data.response as Record<string, unknown> };
  }
  return { hit: false };
}

export async function storeIdempotency(
  admin: SupabaseClient,
  userId: string,
  resourceType: string,
  key: string | undefined,
  response: Record<string, unknown>,
): Promise<void> {
  if (!key) return;

  const fullKey = `${resourceType}:${userId}:${key}`;
  await admin.from("idempotency_keys").upsert({
    key: fullKey,
    user_id: userId,
    resource_type: resourceType,
    response,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function logNotificationFailure(
  admin: SupabaseClient,
  payload: Record<string, unknown>,
  error: string,
): Promise<void> {
  await admin.from("content_pipeline_runs").insert({
    resource_type: "notification_failure",
    resource_id: crypto.randomUUID(),
    actor_user_id: null,
    idempotency_key: `notify-fail:${crypto.randomUUID()}`,
    status: "failed",
    context: { error: error.slice(0, 500), ...payload },
  });
}

export async function captureTargetSnapshot(
  admin: SupabaseClient,
  targetType: string,
  targetId: string,
): Promise<Record<string, unknown>> {
  if (targetType === "post") {
    const { data } = await admin.from("posts").select("id, content_plain, author_profile_id, status").eq("id", targetId).maybeSingle();
    return data ?? { id: targetId };
  }
  if (targetType === "comment") {
    const { data } = await admin.from("comments").select("id, content_plain, post_id, author_profile_id").eq("id", targetId).maybeSingle();
    return data ?? { id: targetId };
  }
  if (targetType === "profile") {
    const { data } = await admin.from("profiles").select("id, slug, display_name, account_kind").eq("id", targetId).maybeSingle();
    return data ?? { id: targetId };
  }
  if (targetType === "message") {
    const { data } = await admin.from("messages").select("id, content_plain, conversation_id, sender_profile_id").eq("id", targetId).maybeSingle();
    return data ?? { id: targetId };
  }
  return { id: targetId, targetType };
}

export async function logAdminAction(
  admin: SupabaseClient,
  actorUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await admin.from("admin_audit_log").insert({
    actor_user_id: actorUserId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? {},
  });
}
