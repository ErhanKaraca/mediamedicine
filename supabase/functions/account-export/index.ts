import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "account-export" });
const EXPORT_TTL_DAYS = 7;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const { data: existing } = await supabase
      .from("account_exports")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["queued", "processing", "ready"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === "ready") {
      return json({ exportId: existing.id, status: existing.status });
    }
    if (existing && ["queued", "processing"].includes(existing.status)) {
      return json({ exportId: existing.id, status: existing.status });
    }

    const expiresAt = new Date(Date.now() + EXPORT_TTL_DAYS * 86400000).toISOString();

    const { data: exportRow, error: insErr } = await supabase
      .from("account_exports")
      .insert({
        user_id: user.id,
        status: "queued",
        expires_at: expiresAt,
      })
      .select("id, status")
      .single();

    if (insErr || !exportRow) {
      return errorResponse("insert_failed", insErr?.message ?? "Failed", 400);
    }

    const admin = createAdminClient();
    await admin.from("content_pipeline_runs").insert({
      resource_type: "account_export",
      resource_id: exportRow.id,
      actor_user_id: user.id,
      idempotency_key: `account-export:${exportRow.id}`,
      status: "queued",
      context: { userId: user.id, exportId: exportRow.id },
    });

    return json({ exportId: exportRow.id, status: exportRow.status }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
