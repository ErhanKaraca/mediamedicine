import type { ChannelPlugin, DeliverContext, DeliverResult } from "../types.ts";
import { getTemplate, renderTemplate } from "../template.ts";

export const emailPlugin: ChannelPlugin = {
  channel: "email",

  async deliver(ctx: DeliverContext): Promise<DeliverResult> {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "notifications@mediamedicine.com";
    if (!apiKey) {
      return { status: "skipped", skipReason: "resend_not_configured" };
    }

    const { data: settings } = await ctx.admin
      .from("user_settings")
      .select("preferences")
      .eq("user_id", ctx.notification.recipient_user_id)
      .maybeSingle();

    const cachedEmail = (settings?.preferences as Record<string, unknown> | null)?.contact_email;
    let recipientEmail = typeof cachedEmail === "string" ? cachedEmail : null;

    if (!recipientEmail) {
      const { data: userData, error: userErr } = await ctx.admin.auth.admin.getUserById(
        ctx.notification.recipient_user_id,
      );
      if (userErr || !userData.user?.email) {
        return { status: "skipped", skipReason: "no_email" };
      }
      recipientEmail = userData.user.email;
    }

    const tmpl = await getTemplate(ctx.admin, ctx.notification.event_type, "email", ctx.locale);
    const vars = {
      actorName: String(ctx.notification.payload?.actorName ?? ""),
      body: ctx.notification.body ?? "",
    };

    const subject = tmpl?.subject
      ? renderTemplate(tmpl.subject, vars)
      : ctx.notification.title;
    const html = tmpl
      ? renderTemplate(tmpl.body, vars)
      : (ctx.notification.body ?? ctx.notification.title);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject,
        html: `<p>${html}</p>`,
      }),
    });

    if (!res.ok) {
      return { status: "failed", error: await res.text() };
    }

    const json = await res.json() as { id?: string };
    return { status: "sent", providerMessageId: json.id };
  },
};
