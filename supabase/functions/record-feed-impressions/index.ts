import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "record-feed-impressions" });

const VALID_EVENTS = ["impression", "click", "dwell", "dismiss"] as const;
const VALID_SURFACES = ["home", "group", "profile"] as const;
const MAX_BATCH = 50;
const DEDUP_EVENTS = new Set(["impression", "click"]);

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("unauthorized", "Invalid session", 401);

    const body = await req.json() as {
      profileId?: string;
      events?: Array<{
        postId: string;
        eventType: string;
        feedSurface?: string;
        dwellMs?: number;
      }>;
    };

    if (!body.profileId || !body.events?.length) {
      return errorResponse("invalid_body", "profileId and events required", 400);
    }
    if (body.events.length > MAX_BATCH) {
      return errorResponse("batch_too_large", `Max ${MAX_BATCH} events`, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("owner_user_id")
      .eq("id", body.profileId)
      .single();
    if (!profile || profile.owner_user_id !== user.id) {
      return errorResponse("forbidden", "Not your profile", 403);
    }

    let inserted = 0;
    let skipped = 0;

    for (const e of body.events) {
      if (!VALID_EVENTS.includes(e.eventType as typeof VALID_EVENTS[number])) {
        return errorResponse("invalid_event", "Invalid event type", 400);
      }
      const surface = e.feedSurface ?? "home";
      if (!VALID_SURFACES.includes(surface as typeof VALID_SURFACES[number])) {
        return errorResponse("invalid_event", "Invalid surface", 400);
      }

      const row = {
        profile_id: body.profileId,
        post_id: e.postId,
        event_type: e.eventType,
        feed_surface: surface,
        dwell_ms: e.dwellMs ?? null,
      };

      const { error } = await supabase.from("feed_impressions").insert(row);
      if (error) {
        if (DEDUP_EVENTS.has(e.eventType) && error.code === "23505") {
          skipped++;
          continue;
        }
        return errorResponse("insert_failed", error.message, 400);
      }
      inserted++;
    }

    return json({ inserted, skipped });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
