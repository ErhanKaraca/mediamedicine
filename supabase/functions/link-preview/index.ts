import { handlePreflight } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { createLogger } from "../_shared/log.ts";
import { fetchWithRedirectLimit, isUrlFetchAllowed } from "../_shared/url-fetch.ts";

const log = createLogger({ fn: "link-preview" });

async function sha256Hex(url: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractMeta(html: string, property: string): string | null {
  const og = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(og);
  if (m) return m[1];
  const name = new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const m2 = html.match(name);
  return m2 ? m2[1] : null;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);

  try {
    const { url } = await req.json() as { url?: string };
    if (!url) return errorResponse("invalid_body", "url required", 400);

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return errorResponse("invalid_url", "URL must be http(s)", 400);
    }

    if (!isUrlFetchAllowed(parsed)) {
      return errorResponse("blocked_url", "URL not allowed", 400);
    }

    const admin = createAdminClient();
    const urlHash = await sha256Hex(url);

    const { data: cached } = await admin
      .from("link_previews")
      .select("*")
      .eq("url_hash", urlHash)
      .maybeSingle();

    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < 86400000) {
      return json(cached);
    }

    let res: Response;
    try {
      res = await fetchWithRedirectLimit(url);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("blocked_url")) return errorResponse("blocked_url", "URL not allowed", 400);
      if (msg.includes("too_many_redirects")) return errorResponse("too_many_redirects", "Too many redirects", 400);
      throw e;
    }

    if (!res.ok) return errorResponse("fetch_failed", `HTTP ${res.status}`, 502);

    const html = await res.text();
    const preview = {
      url_hash: urlHash,
      url,
      title: extractMeta(html, "og:title") ?? extractMeta(html, "title"),
      description: extractMeta(html, "og:description") ?? extractMeta(html, "description"),
      image_url: extractMeta(html, "og:image"),
      site_name: extractMeta(html, "og:site_name"),
      fetched_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await admin.from("link_previews").upsert(preview);
    if (upsertErr) log.warn("cache upsert failed", upsertErr);

    return json(preview);
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
