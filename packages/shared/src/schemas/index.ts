import { z } from "zod";

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
  supabase: z.enum(["ok", "degraded", "down"]),
  ts: z.number(),
});

export const AuthSignupBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
});

export const AuthLoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AuthRefreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
  }),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  account_kind: z.enum(["user", "professional", "page"]),
  owner_user_id: z.string().uuid().nullable(),
  bio: z.string().nullable().optional(),
  follower_count: z.number().optional(),
  following_count: z.number().optional(),
  post_count: z.number().optional(),
});

export const MeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
  }),
  profiles: z.array(ProfileSchema),
  settings: z.record(z.unknown()).nullable(),
});

export const FeedPostSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().nullable(),
  body: z.string().nullable(),
  status: z.string(),
  published_at: z.string().nullable(),
  author_profile_id: z.string().uuid(),
  group_id: z.string().uuid().nullable(),
  content_type: z.string().nullable(),
  feed_score: z.number().nullable().optional(),
});

export const GroupFeedResponseSchema = z.object({
  items: z.array(FeedPostSchema),
  nextCursor: z.string().nullable(),
});

export const SpecialtySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const SpecialtiesResponseSchema = z.object({
  items: z.array(SpecialtySchema),
});

export type AuthSignupBody = z.infer<typeof AuthSignupBodySchema>;
export type AuthLoginBody = z.infer<typeof AuthLoginBodySchema>;
export type AuthRefreshBody = z.infer<typeof AuthRefreshBodySchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type GroupFeedResponse = z.infer<typeof GroupFeedResponseSchema>;
