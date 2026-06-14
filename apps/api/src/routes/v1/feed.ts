import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ApiError, mapDbError } from "@mediamedicine/shared/errors";
import { GroupFeedResponseSchema, ProfileSchema } from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { createUserClient } from "../../lib/supabase";

const PAGE_SIZE = 20;

export const feedRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

const groupFeedRoute = createRoute({
  method: "get",
  path: "/feed/groups/{slug}",
  tags: ["Feed"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ slug: z.string().min(1) }),
    query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().min(1).max(50).optional() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: GroupFeedResponseSchema } },
      description: "Chronological group feed",
    },
  },
});

feedRoutes.openapi(groupFeedRoute, async (c) => {
  const accessToken = c.get("accessToken");
  if (!accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);

  const { slug } = c.req.valid("param");
  const { cursor, limit = PAGE_SIZE } = c.req.valid("query");
  const client = createUserClient(c.env, accessToken);

  const { data: group, error: groupError } = await client
    .from("groups")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (groupError) {
    const mapped = mapDbError(groupError);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }
  if (!group) throw new ApiError("not_found", "Group not found", 404);

  let query = client
    .from("posts")
    .select("id, slug, body, status, published_at, author_profile_id, group_id, content_type, feed_score")
    .eq("group_id", group.id)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const [publishedAt, id] = cursor.split("|");
    if (publishedAt && id) {
      query = query.or(`published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`);
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const items = rows ?? [];
  let nextCursor: string | null = null;
  if (items.length > limit) {
    const last = items.pop()!;
    nextCursor = `${last.published_at}|${last.id}`;
  }

  return c.json({ items, nextCursor });
});

export const profileRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

const profileRoute = createRoute({
  method: "get",
  path: "/profiles/{slug}",
  tags: ["Profiles"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: {
    200: { content: { "application/json": { schema: ProfileSchema } }, description: "Public profile" },
    404: { description: "Not found" },
  },
});

profileRoutes.openapi(profileRoute, async (c) => {
  const accessToken = c.get("accessToken");
  if (!accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);

  const { slug } = c.req.valid("param");
  const client = createUserClient(c.env, accessToken);

  const { data: profile, error } = await client
    .from("profiles")
    .select(
      "id, slug, display_name, avatar_url, account_kind, owner_user_id, bio, follower_count, following_count, post_count",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }
  if (!profile) throw new ApiError("not_found", "Profile not found", 404);

  return c.json(profile);
});
