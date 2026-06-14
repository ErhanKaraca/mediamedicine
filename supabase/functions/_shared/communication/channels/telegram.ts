import type { ChannelPlugin, DeliverContext, DeliverResult } from "../types.ts";
import { getTemplate, renderTemplate } from "../template.ts";

export const telegramPlugin: ChannelPlugin = {
  channel: "telegram",

  async deliver(ctx: DeliverContext): Promise<DeliverResult> {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return { status: "skipped", skipReason: "telegram_not_configured" };
    }

    const { data: settings } = await ctx.admin
      .from("user_settings")
      .select("preferences")
      .eq("user_id", ctx.notification.recipient_user_id)
      .maybeSingle();

    const chatId = (settings?.preferences as Record<string, unknown> | null)?.telegram_chat_id;
    if (!chatId) {
      return { status: "skipped", skipReason: "no_telegram_chat_id" };
    }

    const tmpl = await getTemplate(ctx.admin, ctx.notification.event_type, "telegram", ctx.locale);
    const text = tmpl
      ? renderTemplate(tmpl.body, {
        actorName: String(ctx.notification.payload?.actorName ?? ""),
        body: ctx.notification.body ?? "",
      })
      : ctx.notification.body ?? ctx.notification.title;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      return { status: "failed", error: await res.text() };
    }

    const json = await res.json() as { result?: { message_id?: number } };
    return {
      status: "sent",
      providerMessageId: json.result?.message_id?.toString(),
    };
  },
};
