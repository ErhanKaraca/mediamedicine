import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function resolveChannelEnabled(
  admin: SupabaseClient,
  userId: string,
  profileId: string | null | undefined,
  eventType: string,
  channels: readonly string[],
): Promise<Map<string, boolean>> {
  const { data: settings } = await admin
    .from("user_notification_settings")
    .select("channel, enabled, profile_id")
    .eq("user_id", userId)
    .eq("event_type", eventType);

  const { data: eventRow } = await admin
    .from("notification_event_types")
    .select("default_channels")
    .eq("code", eventType)
    .maybeSingle();

  const defaults = Array.isArray(eventRow?.default_channels)
    ? eventRow.default_channels as string[]
    : null;

  const result = new Map<string, boolean>();

  for (const channel of channels) {
    const profileSpecific = settings?.find(
      (s) => s.channel === channel && s.profile_id === profileId,
    );
    const globalSetting = settings?.find(
      (s) => s.channel === channel && s.profile_id === null,
    );
    const setting = profileSpecific ?? globalSetting;

    if (setting) {
      result.set(channel, setting.enabled);
    } else if (defaults) {
      result.set(channel, defaults.includes(channel));
    } else {
      result.set(channel, true);
    }
  }

  return result;
}
