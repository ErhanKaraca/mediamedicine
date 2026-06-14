import type { ChannelPlugin, DeliverContext, DeliverResult } from "../types.ts";
import { getTemplate, renderTemplate } from "../template.ts";

export const smsPlugin: ChannelPlugin = {
  channel: "sms",

  async deliver(ctx: DeliverContext): Promise<DeliverResult> {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
    if (!accountSid || !authToken || !fromNumber) {
      return { status: "skipped", skipReason: "twilio_not_configured" };
    }

    const { data: settings } = await ctx.admin
      .from("user_settings")
      .select("preferences")
      .eq("user_id", ctx.notification.recipient_user_id)
      .maybeSingle();

    const phone = (settings?.preferences as Record<string, unknown> | null)?.phone as string | undefined;
    if (!phone) {
      return { status: "skipped", skipReason: "no_phone" };
    }

    const tmpl = await getTemplate(ctx.admin, ctx.notification.event_type, "sms", ctx.locale);
    const body = tmpl
      ? renderTemplate(tmpl.body, {
        actorName: String(ctx.notification.payload?.actorName ?? ""),
        body: ctx.notification.body ?? "",
      })
      : ctx.notification.body ?? ctx.notification.title;

    const auth = btoa(`${accountSid}:${authToken}`);
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: body.slice(0, 160),
        }),
      },
    );

    if (!res.ok) {
      return { status: "failed", error: await res.text() };
    }

    const json = await res.json() as { sid?: string };
    return { status: "sent", providerMessageId: json.sid };
  },
};
