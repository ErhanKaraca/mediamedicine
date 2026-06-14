import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { mapDbError, ApiError } from "@mediamedicine/shared/errors";
import { SpecialtiesResponseSchema } from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { createAnonClient } from "../../lib/supabase";

export const specialtyRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

const specialtiesRoute = createRoute({
  method: "get",
  path: "/specialties",
  tags: ["Catalog"],
  responses: {
    200: {
      content: { "application/json": { schema: SpecialtiesResponseSchema } },
      description: "Specialty catalog",
    },
  },
});

specialtyRoutes.openapi(specialtiesRoute, async (c) => {
  const client = createAnonClient(c.env);
  const { data, error } = await client
    .from("specialties")
    .select("id, slug, name, parent_id")
    .order("name", { ascending: true });

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});
