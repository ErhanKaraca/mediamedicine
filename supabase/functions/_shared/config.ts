/** Shared limits — mirror of packages/shared when monorepo is wired. */

export const POST_BODY_MAX_CHARS = 2000;
export const COMMENT_MAX_DEPTH = 3;
export const POST_QUOTE_NESTED_LEVELS = 1;

export const POST_MEDIA = {
  maxSlots: 4,
  maxVideos: 1,
  imageMaxBytes: 10 * 1024 * 1024,
  videoMaxBytes: 50 * 1024 * 1024,
  allowedImageMimes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  allowedVideoMimes: ["video/mp4", "video/webm"],
} as const;

export const POST_ATTACHMENTS = {
  max: 3,
  maxBytes: 5 * 1024 * 1024,
  allowedMimes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ],
} as const;

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  postMedia: "post-media",
  postAttachments: "post-attachments",
  messageMedia: "message-media",
} as const;

export const EVIDENCE_SOURCE_TYPES = [
  "publication",
  "clinical_guideline",
  "book",
  "news_article",
  "external_url",
  "media_asset",
  "own_experience",
  "own_opinion",
  "other",
] as const;

export const MAX_EVIDENCES_PER_POST = 20;

export const NOTIFICATION_CHANNELS = [
  "in_app",
  "realtime",
  "push",
  "email",
  "sms",
  "telegram",
  "slack",
  "whatsapp",
] as const;
