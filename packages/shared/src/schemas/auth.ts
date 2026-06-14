import { z } from "zod";

export const OtpIntentSchema = z.enum(["signup", "login", "auto"]);

export const OtpSendBodySchema = z.object({
  email: z.string().email(),
  intent: OtpIntentSchema.default("auto"),
});

export const OtpSendResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export const OtpVerifyBodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
  deviceName: z.string().min(1).max(100).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  intent: OtpIntentSchema.default("auto"),
});

export const AuthRefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const AuthLogoutBodySchema = z.object({
  scope: z.enum(["local", "others", "global"]).default("local"),
  refreshToken: z.string().min(1).optional(),
});

export const AuthSessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
  sessionId: z.string().uuid().optional(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
  }),
});

export const AuthMeResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    emailConfirmed: z.boolean().optional(),
    createdAt: z.string().optional(),
  }),
});

export const AuthSessionItemSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
  lastUsedAt: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  current: z.boolean().optional(),
});

export const AuthSessionsResponseSchema = z.object({
  items: z.array(AuthSessionItemSchema),
});

export const AuthEmailChangeBodySchema = z.object({
  email: z.string().email(),
});

export const AuthEmailChangeResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export const OAuthProviderSchema = z.enum(["google", "apple"]);

export type AuthEmailChangeBody = z.infer<typeof AuthEmailChangeBodySchema>;
export type OtpSendBody = z.infer<typeof OtpSendBodySchema>;
export type OtpVerifyBody = z.infer<typeof OtpVerifyBodySchema>;
export type AuthRefreshBody = z.infer<typeof AuthRefreshBodySchema>;
export type AuthLogoutBody = z.infer<typeof AuthLogoutBodySchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type AuthSessionItem = z.infer<typeof AuthSessionItemSchema>;
