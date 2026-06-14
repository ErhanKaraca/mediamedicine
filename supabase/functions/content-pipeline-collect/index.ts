import { handlePreflight } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { authorizeServiceRole } from "../_shared/internal-auth.ts";

const log = createLogger({ fn: "content-pipeline-collect" });

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  if (!authorizeServiceRole(req)) {
    return errorResponse("forbidden", "Service role required", 403);
  }

  try {
    const admin = createAdminClient();
    const body = await req.json() as {
      resourceType?: string;
      resourceId?: string;
      idempotencyKey?: string;
      context?: Record<string, unknown>;
      requestId?: string;
    };

    if (!body.resourceType || !body.resourceId || !body.idempotencyKey) {
      return errorResponse("invalid_body", "resourceType, resourceId, idempotencyKey required", 400);
    }

    const { data: run, error } = await admin.from("content_pipeline_runs").upsert({
      resource_type: body.resourceType,
      resource_id: body.resourceId,
      idempotency_key: body.idempotencyKey,
      context: body.context ?? {},
      request_id: body.requestId ?? null,
      status: "context_recorded",
    }, { onConflict: "idempotency_key" }).select("id, status").single();

    if (error) {
      log.error("upsert failed", error);
      return errorResponse("upsert_failed", error.message, 500);
    }

    // v1: no external transcode — mark done; video media → ready (passthrough until real pipeline)
    await admin.from("content_pipeline_runs")
      .update({ status: "done" })
      .eq("id", run.id);

    if (body.resourceType === "media") {
      await admin.from("media")
        .update({ status: "ready" })
        .eq("id", body.resourceId)
        .in("status", ["processing", "pending"]);
    }

    return json({ runId: run.id, status: "done" });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
