import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import {
  EVIDENCE_SOURCE_TYPES,
  MAX_EVIDENCES_PER_POST,
  POST_BODY_MAX_CHARS,
  POST_MEDIA,
  POST_QUOTE_NESTED_LEVELS,
} from "../_shared/config.ts";
import { CONTENT_TYPES, MAX_SPECIALTIES_PER_POST } from "../_shared/feed.ts";
import { computeMedicalQualityScore } from "../_shared/quality.ts";
import { createLogger } from "../_shared/log.ts";
import {
  invokeEmitNotification,
  notifyPostAuthor,
  parseMentionSlugs,
} from "../_shared/notifications.ts";

const log = createLogger({ fn: "create-post" });

interface EvidenceInput {
  sourceType: string;
  identifierType?: string;
  identifierValue?: string;
  title?: string;
  authors?: string;
  publisher?: string;
  pubYear?: number;
  url?: string;
  note?: string;
}

interface CreatePostBody {
  authorProfileId: string;
  groupId?: string | null;
  pageContextId?: string | null;
  content?: Record<string, unknown>;
  contentPlain?: string | null;
  postType?: "standard" | "quote" | "repost";
  contentType?: string;
  quoteOfId?: string | null;
  visibility?: string;
  mediaIds?: string[];
  specialtyIds?: string[];
  evidences?: EvidenceInput[];
  idempotencyKey?: string;
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

    const body = (await req.json()) as CreatePostBody;
    if (!body.authorProfileId) return errorResponse("invalid_body", "authorProfileId required", 400);

    if (body.contentPlain && body.contentPlain.length > POST_BODY_MAX_CHARS) {
      return errorResponse("content_too_long", `Max ${POST_BODY_MAX_CHARS} chars`, 400);
    }

    const contentType = body.contentType ?? "discussion";
    if (!CONTENT_TYPES.includes(contentType as typeof CONTENT_TYPES[number])) {
      return errorResponse("invalid_content_type", "Unknown content type", 400);
    }

    const specialtyIds = body.specialtyIds ?? [];
    if (specialtyIds.length > MAX_SPECIALTIES_PER_POST) {
      return errorResponse("too_many_specialties", `Max ${MAX_SPECIALTIES_PER_POST} specialties`, 400);
    }

    const mediaIds = body.mediaIds ?? [];
    if (mediaIds.length > POST_MEDIA.maxSlots) {
      return errorResponse("too_many_media", `Max ${POST_MEDIA.maxSlots} media items`, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_kind, is_verified, display_name")
      .eq("id", body.authorProfileId)
      .single();

    if (!profile) return errorResponse("profile_not_found", "Author profile not found", 404);

    const needsEvidence = profile.account_kind === "professional" || profile.account_kind === "page";
    const needsSpecialty = needsEvidence;
    const postType = body.postType ?? "standard";
    let evidences = body.evidences ?? [];
    let inheritedEvidences = [...evidences];

    if (postType === "repost" || postType === "quote") {
      if (!body.quoteOfId) {
        return errorResponse("quote_required", "quoteOfId required for repost/quote", 400);
      }
      if (postType === "quote" && !body.contentPlain?.trim()) {
        return errorResponse("content_required", "Quote posts require content", 400);
      }

      const { data: quoted } = await supabase
        .from("posts")
        .select("id, post_type, quote_of_id, allow_reposts, author_profile_id, status, deleted_at")
        .eq("id", body.quoteOfId)
        .single();

      if (!quoted || quoted.deleted_at || quoted.status !== "published") {
        return errorResponse("quoted_not_found", "Quoted post not found", 404);
      }
      if (!quoted.allow_reposts) {
        return errorResponse("reposts_disabled", "Reposts not allowed on this post", 403);
      }
      if (quoted.post_type !== "standard" && POST_QUOTE_NESTED_LEVELS < 1) {
        return errorResponse("nested_quote", "Nested quotes not allowed", 400);
      }

      if (needsEvidence && evidences.length === 0) {
        const { data: quotedEvidence } = await supabase
          .from("post_evidences")
          .select("source_type, identifier_type, identifier_value, title, authors, publisher, pub_year, url, note, display_order")
          .eq("post_id", body.quoteOfId)
          .order("display_order");
        if (quotedEvidence?.length) {
          inheritedEvidences = quotedEvidence.map((e) => ({
            sourceType: e.source_type,
            identifierType: e.identifier_type ?? undefined,
            identifierValue: e.identifier_value ?? undefined,
            title: e.title ?? undefined,
            authors: e.authors ?? undefined,
            publisher: e.publisher ?? undefined,
            pubYear: e.pub_year ?? undefined,
            url: e.url ?? undefined,
            note: e.note ?? undefined,
          }));
        }
      }
    }

    if (needsEvidence && inheritedEvidences.length === 0) {
      return errorResponse("evidence_required", "Professional/page posts require evidence", 400);
    }
    if (needsSpecialty && specialtyIds.length === 0 && !body.groupId) {
      return errorResponse("specialty_required", "Professional/page posts require at least one specialty", 400);
    }

    if (needsSpecialty && specialtyIds.length === 0 && body.groupId) {
      const { count } = await supabase
        .from("group_specialties")
        .select("*", { count: "exact", head: true })
        .eq("group_id", body.groupId);
      if (!count) {
        return errorResponse(
          "specialty_required",
          "Group has no specialties configured; specify specialtyIds or add group specialties",
          400,
        );
      }
    }

    if (inheritedEvidences.length > MAX_EVIDENCES_PER_POST) {
      return errorResponse("too_many_evidences", `Max ${MAX_EVIDENCES_PER_POST}`, 400);
    }

    for (const ev of inheritedEvidences) {
      if (!EVIDENCE_SOURCE_TYPES.includes(ev.sourceType as typeof EVIDENCE_SOURCE_TYPES[number])) {
        return errorResponse("invalid_evidence", "Unknown evidence source type", 400);
      }
    }

    if (specialtyIds.length > 0) {
      const { data: specs, error: specErr } = await supabase
        .from("specialties")
        .select("id")
        .in("id", specialtyIds)
        .eq("is_active", true);
      if (specErr) return errorResponse("specialty_fetch_failed", specErr.message, 400);
      if (!specs || specs.length !== specialtyIds.length) {
        return errorResponse("specialty_not_found", "One or more specialties not found", 400);
      }
    }

    if (mediaIds.length > 0) {
      const { data: mediaRows, error: mediaErr } = await supabase
        .from("media")
        .select("id, kind, status, owner_profile_id")
        .in("id", mediaIds);

      if (mediaErr) return errorResponse("media_fetch_failed", mediaErr.message, 400);
      if (!mediaRows || mediaRows.length !== mediaIds.length) {
        return errorResponse("media_not_found", "One or more media items not found", 400);
      }

      const videoCount = mediaRows.filter((m) => m.kind === "video").length;
      if (videoCount > POST_MEDIA.maxVideos) {
        return errorResponse("too_many_videos", `Max ${POST_MEDIA.maxVideos} video`, 400);
      }

      for (const m of mediaRows) {
        if (m.owner_profile_id !== body.authorProfileId) {
          return errorResponse("media_owner_mismatch", "Media must belong to author profile", 400);
        }
        if (m.status !== "ready" && m.status !== "processing") {
          return errorResponse("media_not_ready", "Media must be uploaded first", 400);
        }
      }
    }

    const estimatedQuality = computeMedicalQualityScore(
      inheritedEvidences.map((e) => ({ sourceType: e.sourceType, identifierType: e.identifierType })),
      { accountKind: profile.account_kind, isVerified: profile.is_verified },
    );

    const { data: post, error: postErr } = await supabase.from("posts").insert({
      author_profile_id: body.authorProfileId,
      actor_user_id: user.id,
      group_id: body.groupId ?? null,
      page_context_id: body.pageContextId ?? null,
      content: body.content ?? {},
      content_plain: body.contentPlain ?? null,
      post_type: postType,
      content_type: contentType,
      quote_of_id: body.quoteOfId ?? null,
      visibility: body.visibility ?? "public",
      status: "published",
      primary_media_id: mediaIds[0] ?? null,
      quality_score: estimatedQuality,
    }).select("id").single();

    if (postErr || !post) {
      log.error("post insert failed", postErr);
      return errorResponse("insert_failed", postErr?.message ?? "Could not create post", 400);
    }

    if (specialtyIds.length > 0) {
      const specRows = specialtyIds.map((sid) => ({
        post_id: post.id,
        specialty_id: sid,
      }));
      const { error: psErr } = await supabase.from("post_specialties").insert(specRows);
      if (psErr) return errorResponse("specialty_insert_failed", psErr.message, 400);
    }

    if (inheritedEvidences.length > 0) {
      const rows = inheritedEvidences.map((ev, i) => ({
        post_id: post.id,
        display_order: i,
        source_type: ev.sourceType,
        identifier_type: ev.identifierType ?? null,
        identifier_value: ev.identifierValue ?? null,
        title: ev.title ?? null,
        authors: ev.authors ?? null,
        publisher: ev.publisher ?? null,
        pub_year: ev.pubYear ?? null,
        url: ev.url ?? null,
        note: ev.note ?? null,
      }));
      const { error: evErr } = await supabase.from("post_evidences").insert(rows);
      if (evErr) return errorResponse("evidence_insert_failed", evErr.message, 400);
    }

    if (mediaIds.length > 0) {
      const pmRows = mediaIds.map((id, i) => ({
        post_id: post.id,
        media_id: id,
        display_order: i,
      }));
      const { error: pmErr } = await supabase.from("post_media").insert(pmRows);
      if (pmErr) return errorResponse("post_media_failed", pmErr.message, 400);
    }

    const { data: refreshed } = await supabase
      .from("posts")
      .select("quality_score")
      .eq("id", post.id)
      .single();

    const idempotencyKey = body.idempotencyKey ?? `post:${post.id}`;
    await supabase.from("content_pipeline_runs").insert({
      resource_type: "post",
      resource_id: post.id,
      actor_user_id: user.id,
      actor_profile_id: body.authorProfileId,
      idempotency_key: idempotencyKey,
      context: { source: "create-post", contentType, qualityScore: refreshed?.quality_score },
    });

    const admin = createAdminClient();
    if (postType === "repost" && body.quoteOfId) {
      notifyPostAuthor(admin, body.quoteOfId, body.authorProfileId, "repost", "Gönderiniz repost edildi")
        .catch((e) => log.warn("repost notify failed", e));
    }

    const mentionSlugs = parseMentionSlugs(body.contentPlain);
    if (mentionSlugs.length > 0) {
      const { data: mentioned } = await admin
        .from("profiles")
        .select("id, slug, owner_user_id, display_name")
        .in("slug", mentionSlugs);
      for (const m of mentioned ?? []) {
        if (m.id === body.authorProfileId || !m.owner_user_id) continue;
        invokeEmitNotification({
          recipientUserId: m.owner_user_id,
          recipientProfileId: m.id,
          actorProfileId: body.authorProfileId,
          eventType: "mention",
          entityType: "post",
          entityId: post.id,
          title: "Bir gönderide bahsedildiniz",
          body: body.contentPlain?.slice(0, 120),
          payload: { actorName: profile.display_name ?? "Someone", deepLink: `/post/${post.id}` },
        }).catch((e) => log.warn("mention notify failed", e));
      }
    }

    return json({
      postId: post.id,
      qualityScore: refreshed?.quality_score ?? estimatedQuality,
    }, { status: 201 });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
