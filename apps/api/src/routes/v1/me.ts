import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { ApiError, mapDbError } from "@mediamedicine/shared/errors";
import { MeResponseSchema } from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { createUserClient } from "../../lib/supabase";

export const meRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

const meRoute = createRoute({
  method: "get",
  path: "/me",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { content: { "application/json": { schema: MeResponseSchema } }, description: "Current user" },
  },
});

meRoutes.openapi(meRoute, async (c) => {
  const userId = c.get("userId");
  const accessToken = c.get("accessToken");
  if (!userId || !accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);

  const client = createUserClient(c.env, accessToken);

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select(
      "id, slug, display_name, avatar_url, account_kind, owner_user_id, bio, follower_count, following_count, post_count",
    )
    .eq("owner_user_id", userId)
    .is("deleted_at", null);

  if (profilesError) {
    const mapped = mapDbError(profilesError);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const { data: settingsRow } = await client
    .from("user_settings")
    .select("preferences, locale, timezone")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: authUser } = await client.auth.getUser();

  return c.json({
    user: {
      id: userId,
      email: authUser.user?.email ?? undefined,
    },
    profiles: profiles ?? [],
    settings: settingsRow ?? null,
  });
});

const meProfilesRoute = createRoute({
  method: "get",
  path: "/me/profiles",
  tags: ["User"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MeResponseSchema.pick({ profiles: true }),
        },
      },
      description: "Owned profiles",
    },
  },
});

meRoutes.openapi(meProfilesRoute, async (c) => {
  const userId = c.get("userId");
  const accessToken = c.get("accessToken");
  if (!userId || !accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);

  const client = createUserClient(c.env, accessToken);
  const { data: profiles, error } = await client
    .from("profiles")
    .select("id, slug, display_name, avatar_url, account_kind, owner_user_id")
    .eq("owner_user_id", userId)
    .is("deleted_at", null);

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ profiles: profiles ?? [] });
});
