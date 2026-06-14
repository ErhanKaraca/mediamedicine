import * as jose from "npm:jose@5";
import type { ChannelPlugin, DeliverContext, DeliverResult } from "../types.ts";
import { getTemplate, renderTemplate } from "../template.ts";

async function getFcmAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const pk = await jose.importPKCS8(serviceAccount.private_key, "RS256");
  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(serviceAccount.client_email)
    .setAudience(serviceAccount.token_uri)
    .setExpirationTime("1h")
    .sign(pk);

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) throw new Error(`fcm_token_${tokenRes.status}`);
  const tokenJson = await tokenRes.json() as { access_token: string };
  return tokenJson.access_token;
}

export const pushPlugin: ChannelPlugin = {
  channel: "push",

  async deliver(ctx: DeliverContext): Promise<DeliverResult> {
    const saJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return { status: "skipped", skipReason: "fcm_not_configured" };
    }

    let serviceAccount: { project_id: string; client_email: string; private_key: string; token_uri: string };
    try {
      serviceAccount = JSON.parse(saJson);
    } catch {
      return { status: "failed", error: "invalid_fcm_service_account_json" };
    }

    const { data: devices } = await ctx.admin
      .from("user_devices")
      .select("id, push_token, platform")
      .eq("user_id", ctx.notification.recipient_user_id)
      .eq("enabled", true);

    if (!devices?.length) {
      return { status: "skipped", skipReason: "no_device_token" };
    }

    const tmpl = await getTemplate(ctx.admin, ctx.notification.event_type, "push", ctx.locale);
    const bodyText = tmpl
      ? renderTemplate(tmpl.body, {
        actorName: String(ctx.notification.payload?.actorName ?? ctx.notification.title),
        body: ctx.notification.body ?? "",
      })
      : ctx.notification.body ?? ctx.notification.title;

    let accessToken: string;
    try {
      accessToken = await getFcmAccessToken(serviceAccount);
    } catch (e) {
      return { status: "failed", error: String(e) };
    }

    const sentIds: string[] = [];
    const results = await Promise.all(devices.map(async (device) => {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: device.push_token,
              notification: {
                title: ctx.notification.title,
                body: bodyText,
              },
              data: {
                notificationId: ctx.notification.id,
                eventType: ctx.notification.event_type,
              },
            },
          }),
        },
      );

      if (res.ok) {
        const json = await res.json() as { name?: string };
        return { ok: true as const, id: json.name ?? device.id, deviceId: device.id };
      }

      const errText = await res.text();
      if (errText.includes("UNREGISTERED") || errText.includes("INVALID_ARGUMENT")) {
        await ctx.admin.from("user_devices").update({ enabled: false }).eq("id", device.id);
      }
      return { ok: false as const, deviceId: device.id };
    }));

    for (const r of results) {
      if (r.ok) sentIds.push(r.id);
    }

    if (sentIds.length === 0) {
      return { status: "failed", error: "all_push_attempts_failed" };
    }
    return { status: "sent", providerMessageId: sentIds.join(",") };
  },
};
