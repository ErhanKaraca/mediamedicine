import { z } from "zod";

export const PatchMeProfileBodySchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const PatchMeSettingsBodySchema = z.object({
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(2).max(64).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export const PutMeSpecialtiesBodySchema = z.object({
  specialtyIds: z.array(z.string().uuid()).min(1).max(20),
});

export const SlugAvailableQuerySchema = z.object({
  slug: z.string().min(3).max(40),
});

export const SlugAvailableResponseSchema = z.object({
  available: z.boolean(),
  reason: z.string().optional(),
  suggestion: z.string().optional(),
});

export const ConsentVersionSchema = z.object({
  id: z.string(),
  type: z.enum(["terms", "privacy", "marketing"]),
  version: z.string(),
  is_current: z.boolean(),
  effective_at: z.string(),
});

export const ConsentVersionsResponseSchema = z.object({
  items: z.array(ConsentVersionSchema),
});

export const PostMeConsentsBodySchema = z.object({
  termsVersion: z.string(),
  privacyVersion: z.string(),
  marketing: z.boolean().optional(),
});

export const UserConsentSchema = z.object({
  id: z.string().uuid(),
  terms_version: z.string(),
  privacy_version: z.string(),
  marketing: z.boolean(),
  recorded_at: z.string(),
});

export const MeConsentsResponseSchema = z.object({
  items: z.array(UserConsentSchema),
});

export const CapabilitiesSchema = z.object({
  accountKind: z.enum(["user", "professional", "page"]),
  isVerified: z.boolean(),
  canPostToGroups: z.boolean(),
  canUsePersonalWall: z.boolean(),
  canFollow: z.boolean(),
  canCreatePage: z.boolean(),
});

export const ProfessionalUpgradeSchema = z.object({
  eligible: z.boolean(),
  activeCase: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
      submittedAt: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export const MeCapabilitiesResponseSchema = z.object({
  capabilities: CapabilitiesSchema,
  professionalUpgrade: ProfessionalUpgradeSchema,
});

export const UserSpecialtySchema = z.object({
  specialty_id: z.string().uuid(),
  source: z.string(),
  weight: z.number(),
});

export const MeSpecialtiesResponseSchema = z.object({
  items: z.array(UserSpecialtySchema),
});

export type PatchMeProfileBody = z.infer<typeof PatchMeProfileBodySchema>;
export type PatchMeSettingsBody = z.infer<typeof PatchMeSettingsBodySchema>;
export type PutMeSpecialtiesBody = z.infer<typeof PutMeSpecialtiesBodySchema>;
export type MeCapabilitiesResponse = z.infer<typeof MeCapabilitiesResponseSchema>;
