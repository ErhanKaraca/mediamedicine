import type { ChannelPlugin, DeliverContext, DeliverResult } from "../types.ts";

export const realtimePlugin: ChannelPlugin = {
  channel: "realtime",

  async deliver(ctx: DeliverContext): Promise<DeliverResult> {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) {
      return { status: "failed", error: "missing_supabase_env" };
    }

    const topic = `user:${ctx.notification.recipient_user_id}:notifications`;
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic,
          event: "notification",
          payload: {
            notificationId: ctx.notification.id,
            eventType: ctx.notification.event_type,
            title: ctx.notification.title,
            body: ctx.notification.body,
            entityType: ctx.notification.entity_type,
            entityId: ctx.notification.entity_id,
          },
        }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { status: "failed", error: `realtime_broadcast_${res.status}: ${text}` };
    }

    return { status: "sent", providerMessageId: topic };
  },
};
