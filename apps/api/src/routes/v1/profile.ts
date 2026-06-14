import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ApiError, mapDbError } from "@mediamedicine/shared/errors";
import {
  ConsentVersionsResponseSchema,
  MeCapabilitiesResponseSchema,
  MeConsentsResponseSchema,
  MeSpecialtiesResponseSchema,
  PatchMeProfileBodySchema,
  PatchMeSettingsBodySchema,
  PostMeConsentsBodySchema,
  ProfileSchema,
  PutMeSpecialtiesBodySchema,
  SlugAvailableQuerySchema,
  SlugAvailableResponseSchema,
} from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { buildCapabilities, buildProfessionalUpgrade } from "../../lib/capabilities";
import { suggestSlug, validateSlug } from "../../lib/slug";
import { createAnonClient, createUserClient } from "../../lib/supabase";

export const profileRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

function requireAuth(c: { get: (k: "userId" | "accessToken") => string | undefined }) {
  const userId = c.get("userId");
  const accessToken = c.get("accessToken");
  if (!userId || !accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);
  return { userId, accessToken };
}

async function getPersonalProfile(client: ReturnType<typeof createUserClient>, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, slug, display_name, avatar_url, account_kind, owner_user_id, bio, is_verified")
    .eq("owner_user_id", userId)
    .in("account_kind", ["user", "professional"])
    .is("deleted_at", null)
    .order("account_kind", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }
  if (!data) throw new ApiError("profile_not_found", "Personal profile not found", 404);
  return data;
}

const patchProfileRoute = createRoute({
  method: "patch",
  path: "/me/profile",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: PatchMeProfileBodySchema } } } },
  responses: {
    200: { content: { "application/json": { schema: ProfileSchema } }, description: "Updated profile" },
  },
});

profileRoutes.openapi(patchProfileRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const body = c.req.valid("json");
  const client = createUserClient(c.env, accessToken);
  const profile = await getPersonalProfile(client, userId);

  const updates: Record<string, unknown> = {};
  if (body.displayName !== undefined) updates.display_name = body.displayName;
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;

  if (body.slug !== undefined) {
    const check = validateSlug(body.slug);
    if (!check.ok) throw new ApiError(check.reason, "Invalid slug", 400);
    updates.slug = body.slug.toLowerCase();
  }

  if (Object.keys(updates).length === 0) {
    return c.json({
      id: profile.id,
      slug: profile.slug,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      account_kind: profile.account_kind,
      owner_user_id: profile.owner_user_id,
      bio: profile.bio,
    });
  }

  const { data, error } = await client
    .from("profiles")
    .update(updates)
    .eq("id", profile.id)
    .select("id, slug, display_name, avatar_url, account_kind, owner_user_id, bio")
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json(data);
});

const slugAvailableRoute = createRoute({
  method: "get",
  path: "/me/slug-available",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  request: { query: SlugAvailableQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: SlugAvailableResponseSchema } },
      description: "Slug availability",
    },
  },
});

profileRoutes.openapi(slugAvailableRoute, async (c) => {
  requireAuth(c);
  const { slug } = c.req.valid("query");
  const check = validateSlug(slug);
  if (!check.ok) {
    return c.json({ available: false, reason: check.reason, suggestion: suggestSlug(slug) });
  }

  const client = createAnonClient(c.env);
  const { data } = await client.from("profiles").select("id").eq("slug", slug.toLowerCase()).maybeSingle();
  if (data) {
    return c.json({ available: false, reason: "taken", suggestion: suggestSlug(slug) });
  }
  return c.json({ available: true });
});

const patchSettingsRoute = createRoute({
  method: "patch",
  path: "/me/settings",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: PatchMeSettingsBodySchema } } } },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            locale: z.string().nullable(),
            timezone: z.string().nullable(),
            preferences: z.record(z.unknown()),
          }),
        },
      },
      description: "Updated settings",
    },
  },
});

profileRoutes.openapi(patchSettingsRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const body = c.req.valid("json");
  const client = createUserClient(c.env, accessToken);

  const updates: Record<string, unknown> = {};
  if (body.locale !== undefined) updates.locale = body.locale;
  if (body.timezone !== undefined) updates.timezone = body.timezone;
  if (body.preferences !== undefined) updates.preferences = body.preferences;

  const { data, error } = await client
    .from("user_settings")
    .update(updates)
    .eq("user_id", userId)
    .select("locale, timezone, preferences")
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json(data);
});

const getSpecialtiesRoute = createRoute({
  method: "get",
  path: "/me/specialties",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: MeSpecialtiesResponseSchema } },
      description: "User specialties",
    },
  },
});

profileRoutes.openapi(getSpecialtiesRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const client = createUserClient(c.env, accessToken);
  const profile = await getPersonalProfile(client, userId);

  const { data, error } = await client
    .from("user_specialties")
    .select("specialty_id, source, weight")
    .eq("profile_id", profile.id);

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});

const putSpecialtiesRoute = createRoute({
  method: "put",
  path: "/me/specialties",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: PutMeSpecialtiesBodySchema } } } },
  responses: {
    200: {
      content: { "application/json": { schema: MeSpecialtiesResponseSchema } },
      description: "Replaced specialties",
    },
  },
});

profileRoutes.openapi(putSpecialtiesRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const body = c.req.valid("json");
  const client = createUserClient(c.env, accessToken);
  const profile = await getPersonalProfile(client, userId);

  const { error: delErr } = await client.from("user_specialties").delete().eq("profile_id", profile.id);
  if (delErr) {
    const mapped = mapDbError(delErr);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const rows = body.specialtyIds.map((specialtyId) => ({
    profile_id: profile.id,
    specialty_id: specialtyId,
    source: "manual" as const,
  }));

  const { data, error } = await client
    .from("user_specialties")
    .insert(rows)
    .select("specialty_id, source, weight");

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});

const consentVersionsRoute = createRoute({
  method: "get",
  path: "/consent-versions",
  tags: ["Legal"],
  responses: {
    200: {
      content: { "application/json": { schema: ConsentVersionsResponseSchema } },
      description: "Current consent versions",
    },
  },
});

profileRoutes.openapi(consentVersionsRoute, async (c) => {
  const client = createAnonClient(c.env);
  const { data, error } = await client
    .from("consent_versions")
    .select("id, type, version, is_current, effective_at")
    .eq("is_current", true);

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});

const getConsentsRoute = createRoute({
  method: "get",
  path: "/me/consents",
  tags: ["Legal"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: MeConsentsResponseSchema } },
      description: "Recorded consents",
    },
  },
});

profileRoutes.openapi(getConsentsRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const client = createUserClient(c.env, accessToken);
  const { data, error } = await client
    .from("user_consents")
    .select("id, terms_version, privacy_version, marketing, recorded_at")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});

const UserConsentSchema = z.object({
  id: z.string().uuid(),
  terms_version: z.string(),
  privacy_version: z.string(),
  marketing: z.boolean(),
  recorded_at: z.string(),
});

const postConsentsRoute = createRoute({
  method: "post",
  path: "/me/consents",
  tags: ["Legal"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: PostMeConsentsBodySchema } } } },
  responses: {
    201: {
      content: { "application/json": { schema: UserConsentSchema } },
      description: "Consent recorded",
    },
  },
});

profileRoutes.openapi(postConsentsRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const body = c.req.valid("json");
  const client = createUserClient(c.env, accessToken);

  const { data: currentVersions, error: verErr } = await client
    .from("consent_versions")
    .select("id, type")
    .eq("is_current", true);

  if (verErr) {
    const mapped = mapDbError(verErr);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const termsOk = currentVersions?.some((v) => v.id === body.termsVersion && v.type === "terms");
  const privacyOk = currentVersions?.some((v) => v.id === body.privacyVersion && v.type === "privacy");
  if (!termsOk || !privacyOk) {
    throw new ApiError("outdated_consent_version", "Consent version is not current", 409);
  }

  const { data, error } = await client
    .from("user_consents")
    .insert({
      user_id: userId,
      terms_version: body.termsVersion,
      privacy_version: body.privacyVersion,
      marketing: body.marketing ?? false,
    })
    .select("id, terms_version, privacy_version, marketing, recorded_at")
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json(data, 201);
});

const capabilitiesRoute = createRoute({
  method: "get",
  path: "/me/capabilities",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: MeCapabilitiesResponseSchema } },
      description: "Derived capabilities",
    },
  },
});

profileRoutes.openapi(capabilitiesRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const client = createUserClient(c.env, accessToken);
  const profile = await getPersonalProfile(client, userId);

  const { data: institutionCase } = await client
    .from("kyc_cases")
    .select("id")
    .eq("user_id", userId)
    .eq("case_type", "healthcare_institution")
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  const { data: proCase } = await client
    .from("kyc_cases")
    .select("id, case_type, status, submitted_at")
    .eq("user_id", userId)
    .eq("case_type", "healthcare_professional")
    .not("status", "in", '("withdrawn")')
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const capabilities = buildCapabilities(profile, !!institutionCase);
  const professionalUpgrade = buildProfessionalUpgrade(profile.account_kind, proCase);

  return c.json({ capabilities, professionalUpgrade });
});
