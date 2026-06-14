import { handlePreflight } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { authorizeServiceRole } from "../_shared/internal-auth.ts";
import { deliverNotification } from "../_shared/communication/router.ts";
import { backoffSeconds } from "../_shared/communication/template.ts";
import type { NotificationRow } from "../_shared/communication/types.ts";

const log = createLogger({ fn: "communication-dispatch" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);
  if (!authorizeServiceRole(req)) return errorResponse("forbidden", "Service role or cron secret required", 403);

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) as { batchSize?: number } : {};
    const batchSize = Math.min(body.batchSize ?? 50, 100);
    const admin = createAdminClient();
    const workerId = `dispatch-${crypto.randomUUID().slice(0, 8)}`;

    const { data: claimed, error: claimErr } = await admin.rpc(
      "claim_pending_notification_deliveries",
      { p_batch_size: batchSize, p_worker_id: workerId },
    );

    if (claimErr) {
      log.error("claim failed", claimErr);
      return errorResponse("claim_failed", claimErr.message, 500);
    }

    const deliveries = claimed ?? [];
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const delivery of deliveries) {
      const { data: notification, error: notifErr } = await admin
        .from("notifications")
        .select("*")
        .eq("id", delivery.notification_id)
        .single();

      if (notifErr || !notification) {
        await admin.from("notification_deliveries").update({
          status: "failed",
          error: "notification_not_found",
          locked_at: null,
          locked_by: null,
        }).eq("id", delivery.id);
        failed++;
        continue;
      }

      const { data: settings } = await admin
        .from("user_settings")
        .select("locale")
        .eq("user_id", notification.recipient_user_id)
        .maybeSingle();

      const result = await deliverNotification(
        admin,
        delivery,
        notification as NotificationRow,
        settings?.locale ?? "tr",
      );

      if (result.status === "sent") {
        await admin.from("notification_deliveries").update({
          status: "sent",
          provider_message_id: result.providerMessageId ?? null,
          sent_at: new Date().toISOString(),
          locked_at: null,
          locked_by: null,
          error: null,
        }).eq("id", delivery.id);
        sent++;
      } else if (result.status === "skipped") {
        await admin.from("notification_deliveries").update({
          status: "skipped",
          skip_reason: result.skipReason ?? "skipped",
          locked_at: null,
          locked_by: null,
        }).eq("id", delivery.id);
        skipped++;
      } else {
        const attempts = delivery.attempts ?? 1;
        const maxAttempts = delivery.max_attempts ?? 5;
        const isDead = attempts >= maxAttempts;
        await admin.from("notification_deliveries").update({
          status: isDead ? "failed" : "pending",
          error: result.error ?? "delivery_failed",
          next_retry_at: isDead
            ? null
            : new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString(),
          locked_at: null,
          locked_by: null,
        }).eq("id", delivery.id);
        failed++;
      }
    }

    return json({ processed: deliveries.length, sent, failed, skipped });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
