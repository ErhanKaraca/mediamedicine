import type { Env } from "../env";
import { createServiceClient } from "./supabase";

export interface DeviceMetadataInput {
  userId: string;
  sessionId: string;
  deviceName?: string;
  platform?: "ios" | "android" | "web";
  userAgent?: string;
}

export async function upsertSessionDeviceMetadata(
  env: Env,
  input: DeviceMetadataInput,
): Promise<void> {
  const admin = createServiceClient(env);
  const platform = input.platform ?? "web";

  const { data: existing } = await admin
    .from("user_devices")
    .select("id")
    .eq("user_id", input.userId)
    .eq("gotrue_session_id", input.sessionId)
    .maybeSingle();

  const row = {
    user_id: input.userId,
    platform,
    gotrue_session_id: input.sessionId,
    device_name: input.deviceName ?? null,
    user_agent: input.userAgent ?? null,
    enabled: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await admin.from("user_devices").update(row).eq("id", existing.id);
    return;
  }

  await admin.from("user_devices").insert({
    ...row,
    push_token: null,
  });
}

export async function disableSessionDeviceMetadata(
  env: Env,
  userId: string,
  sessionId: string,
): Promise<void> {
  const admin = createServiceClient(env);
  await admin
    .from("user_devices")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("gotrue_session_id", sessionId);
}

export async function loadDeviceMetadataMap(
  env: Env,
  userId: string,
  sessionIds: string[],
): Promise<Map<string, { deviceName?: string; platform?: string }>> {
  const map = new Map<string, { deviceName?: string; platform?: string }>();
  if (sessionIds.length === 0) return map;

  const admin = createServiceClient(env);
  const { data } = await admin
    .from("user_devices")
    .select("gotrue_session_id, device_name, platform")
    .eq("user_id", userId)
    .in("gotrue_session_id", sessionIds);

  for (const row of data ?? []) {
    if (!row.gotrue_session_id) continue;
    map.set(row.gotrue_session_id, {
      deviceName: row.device_name ?? undefined,
      platform: row.platform ?? undefined,
    });
  }
  return map;
}
