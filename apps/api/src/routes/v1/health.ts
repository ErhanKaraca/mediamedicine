import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HealthResponseSchema } from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { pingSupabase } from "../../lib/supabase";

export const healthRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  responses: {
    200: {
      content: { "application/json": { schema: HealthResponseSchema } },
      description: "API health check",
    },
  },
});

healthRoutes.openapi(healthRoute, async (c) => {
  const supabase = await pingSupabase(c.env);
  return c.json({
    status: "ok" as const,
    service: "mediamedicine-api",
    version: "v1",
    supabase,
    ts: Date.now(),
  });
});
