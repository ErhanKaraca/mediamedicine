import { handlePreflight } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { NOTIFICATION_CHANNELS } from "../_shared/config.ts";
import { createLogger } from "../_shared/log.ts";
import { authorizeServiceRole } from "../_shared/internal-auth.ts";
import { resolveChannelEnabled } from "../_shared/notification-channels.ts";

const log = createLogger({ fn: "emit-notification" });

interface EmitBody {
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

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  if (!authorizeServiceRole(req)) {
    return errorResponse("forbidden", "Service role required", 403);
  }

  try {
    const admin = createAdminClient();
    const body = (await req.json()) as EmitBody;

    if (!body.recipientUserId || !body.eventType || !body.title) {
      return errorResponse("invalid_body", "recipientUserId, eventType, title required", 400);
    }

    const { data: notif, error: notifErr } = await admin.from("notifications").insert({
      recipient_user_id: body.recipientUserId,
      recipient_profile_id: body.recipientProfileId ?? null,
      actor_profile_id: body.actorProfileId ?? null,
      event_type: body.eventType,
      entity_type: body.entityType ?? null,
      entity_id: body.entityId ?? null,
      title: body.title,
      body: body.body ?? null,
      payload: body.payload ?? {},
    }).select("id").single();

    if (notifErr || !notif) {
      log.error("notification insert failed", notifErr);
      return errorResponse("insert_failed", notifErr?.message ?? "Failed", 500);
    }

    const channels = body.channels ?? [...NOTIFICATION_CHANNELS];
    const enabledMap = await resolveChannelEnabled(
      admin,
      body.recipientUserId,
      body.recipientProfileId,
      body.eventType,
      channels,
    );

    const deliveries: Array<Record<string, unknown>> = [];

    for (const channel of channels) {
      const enabled = enabledMap.get(channel) ?? true;

      if (channel === "in_app") {
        deliveries.push({
          notification_id: notif.id,
          channel,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        continue;
      }

      deliveries.push({
        notification_id: notif.id,
        channel,
        status: enabled ? "pending" : "skipped",
        skip_reason: enabled ? null : "user_disabled",
      });
    }

    if (deliveries.length > 0) {
      const { error: delErr } = await admin.from("notification_deliveries").insert(deliveries);
      if (delErr) log.warn("delivery insert failed", delErr);
    }

    const hasPending = deliveries.some((d) => d.status === "pending");
    if (hasPending) {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && serviceKey) {
        fetch(`${url}/functions/v1/communication-dispatch`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchSize: 10 }),
        }).catch((e) => log.warn("dispatch invoke failed", e));
      }
    }

    return json({ notificationId: notif.id, deliveries: deliveries.length });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
