import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
import { POST_ATTACHMENTS, POST_MEDIA, STORAGE_BUCKETS } from "../_shared/config.ts";
import { createLogger } from "../_shared/log.ts";

const log = createLogger({ fn: "media-upload-init" });

type UploadKind = "image" | "video" | "document";

interface InitBody {
  ownerProfileId: string;
  kind: UploadKind;
  mimeType: string;
  fileSize: number;
  originalName: string;
  context?: "post" | "message";
  conversationId?: string;
}

function bucketForKind(kind: UploadKind, context: "post" | "message"): string {
  if (context === "message") return STORAGE_BUCKETS.messageMedia;
  if (kind === "document") return STORAGE_BUCKETS.postAttachments;
  return STORAGE_BUCKETS.postMedia;
}

function validateUpload(body: InitBody): string | null {
  const { kind, mimeType, fileSize } = body;
  if (kind === "image") {
    if (!POST_MEDIA.allowedImageMimes.includes(mimeType)) return "unsupported_image_mime";
    if (fileSize > POST_MEDIA.imageMaxBytes) return "image_too_large";
  } else if (kind === "video") {
    if (!POST_MEDIA.allowedVideoMimes.includes(mimeType)) return "unsupported_video_mime";
    if (fileSize > POST_MEDIA.videoMaxBytes) return "video_too_large";
  } else {
    if (!POST_ATTACHMENTS.allowedMimes.includes(mimeType)) return "unsupported_attachment_mime";
    if (fileSize > POST_ATTACHMENTS.maxBytes) return "attachment_too_large";
  }
  return null;
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

    const body = (await req.json()) as InitBody;
    if (!body.ownerProfileId || !body.kind || !body.mimeType || !body.fileSize || !body.originalName) {
      return errorResponse("invalid_body", "Missing required fields", 400);
    }

    const context = body.context ?? "post";
    if (context === "message") {
      if (!body.conversationId) {
        return errorResponse("invalid_body", "conversationId required for message uploads", 400);
      }
      if (body.kind === "document") {
        return errorResponse("invalid_kind", "Documents not supported in messages", 400);
      }
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("profile_id")
        .eq("conversation_id", body.conversationId)
        .eq("profile_id", body.ownerProfileId)
        .maybeSingle();
      if (!participant) {
        return errorResponse("forbidden", "Not a conversation participant", 403);
      }
    }

    const validationErr = validateUpload(body);
    if (validationErr) return errorResponse(validationErr, "Upload validation failed", 400);

    const mediaId = crypto.randomUUID();
    const ext = body.originalName.split(".").pop()?.toLowerCase() ?? "bin";
    const bucket = bucketForKind(body.kind, context);
    const storagePath = `${body.ownerProfileId}/${mediaId}.${ext}`;

    const { data: mediaRow, error: insertErr } = await supabase.from("media").insert({
      id: mediaId,
      owner_profile_id: body.ownerProfileId,
      uploader_user_id: user.id,
      kind: body.kind,
      bucket,
      storage_path: storagePath,
      original_name: body.originalName,
      mime_type: body.mimeType,
      file_size: body.fileSize,
      status: "pending",
    }).select("id").single();

    if (insertErr) {
      log.error("media insert failed", insertErr);
      return errorResponse("insert_failed", insertErr.message, 400);
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (signErr || !signed) {
      log.error("signed url failed", signErr);
      return errorResponse("signed_url_failed", signErr?.message ?? "Could not create upload URL", 500);
    }

    return json({
      mediaId: mediaRow.id,
      bucket,
      storagePath,
      signedUrl: signed.signedUrl,
      token: signed.token,
    });
  } catch (e) {
    log.error("unexpected", e);
    return errorResponse("internal_error", "Unexpected error", 500);
  }
});
