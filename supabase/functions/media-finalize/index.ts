import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "media-finalize" });

async function invokePipelineCollect(mediaId: string): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return;
  try {
    await fetch(`${url}/functions/v1/content-pipeline-collect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resourceType: "media",
        resourceId: mediaId,
        idempotencyKey: `media:${mediaId}`,
        context: { source: "media-finalize" },
      }),
    });
  } catch (e) {
    log.warn("pipeline invoke failed", e);
  }
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { mediaId } = await req.json() as { mediaId?: string };
    if (!mediaId) return errorResponse("invalid_body", "mediaId required", 400);

    const { data: media, error: fetchErr } = await supabase
      .from("media")
      .select("id, uploader_user_id, kind, status")
      .eq("id", mediaId)
      .single();

    if (fetchErr || !media) return errorResponse("not_found", "Media not found", 404);
    if (media.uploader_user_id !== user.id) return errorResponse("forbidden", "Not your upload", 403);
    if (media.status !== "pending") return errorResponse("invalid_state", "Media already finalized", 409);

    const nextStatus = media.kind === "video" ? "processing" : "ready";

    const { error: updateErr } = await supabase
      .from("media")
      .update({ status: nextStatus })
      .eq("id", mediaId);

    if (updateErr) {
      log.error("update failed", updateErr);
      return errorResponse("update_failed", updateErr.message, 500);
    }

    if (nextStatus === "processing") {
      invokePipelineCollect(mediaId).catch((e) => log.warn("pipeline failed", e));
    }

    return json({ mediaId, status: nextStatus });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
