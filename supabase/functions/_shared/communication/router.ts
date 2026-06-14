import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { getSystemSetting } from "../settings-cache.ts";
import type { ChannelPlugin, DeliverContext, DeliverResult, DeliveryRow, NotificationRow } from "./types.ts";
import { realtimePlugin } from "./channels/realtime.ts";
import { pushPlugin } from "./channels/push.ts";
import { emailPlugin } from "./channels/email.ts";
import { smsPlugin } from "./channels/sms.ts";
import { telegramPlugin } from "./channels/telegram.ts";
import { slackPlugin, whatsappPlugin } from "./channels/stub.ts";

const plugins = new Map<string, ChannelPlugin>([
  [realtimePlugin.channel, realtimePlugin],
  [pushPlugin.channel, pushPlugin],
  [emailPlugin.channel, emailPlugin],
  [smsPlugin.channel, smsPlugin],
  [telegramPlugin.channel, telegramPlugin],
  [slackPlugin.channel, slackPlugin],
  [whatsappPlugin.channel, whatsappPlugin],
]);

export function getChannelPlugin(channel: string): ChannelPlugin | undefined {
  return plugins.get(channel);
}

export async function isChannelGloballyEnabled(
  admin: SupabaseClient,
  channel: string,
): Promise<boolean> {
  const enabled = await getSystemSetting<string[]>(
    admin,
    "communication.enabled_channels",
    [],
  );
  if (!enabled.length) return true;
  return enabled.includes(channel);
}

export async function shouldNotifyChannel(
  admin: SupabaseClient,
  userId: string,
  profileId: string | null,
  eventType: string,
  channel: string,
): Promise<boolean> {
  const { data, error } = await admin.rpc("should_notify_channel", {
    p_user_id: userId,
    p_profile_id: profileId,
    p_event_type: eventType,
    p_channel: channel,
  });

  if (error) {
    let q = admin
      .from("user_notification_settings")
      .select("enabled")
      .eq("user_id", userId)
      .eq("event_type", eventType)
      .eq("channel", channel);
    q = profileId ? q.eq("profile_id", profileId) : q.is("profile_id", null);
    const { data: userSetting } = await q.maybeSingle();
    if (userSetting) return userSetting.enabled;

    const { data: eventRow } = await admin
      .from("notification_event_types")
      .select("default_channels")
      .eq("code", eventType)
      .maybeSingle();
    if (eventRow?.default_channels && Array.isArray(eventRow.default_channels)) {
      return eventRow.default_channels.includes(channel);
    }
    return true;
  }

  return Boolean(data);
}

export async function deliverNotification(
  admin: SupabaseClient,
  delivery: DeliveryRow,
  notification: NotificationRow,
  locale = "tr",
): Promise<DeliverResult> {
  if (delivery.channel === "in_app") {
    return { status: "sent", providerMessageId: "in_app" };
  }

  const enabled = await isChannelGloballyEnabled(admin, delivery.channel);
  if (!enabled) {
    return { status: "skipped", skipReason: "system_disabled" };
  }

  const userEnabled = await shouldNotifyChannel(
    admin,
    notification.recipient_user_id,
    notification.recipient_profile_id,
    notification.event_type,
    delivery.channel,
  );
  if (!userEnabled) {
    return { status: "skipped", skipReason: "user_disabled" };
  }

  const plugin = getChannelPlugin(delivery.channel);
  if (!plugin) {
    return { status: "skipped", skipReason: "unknown_channel" };
  }

  const ctx: DeliverContext = { admin, delivery, notification, locale };
  return plugin.deliver(ctx);
}
