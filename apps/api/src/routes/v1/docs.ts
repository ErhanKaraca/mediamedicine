import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppVariables, Env } from "../../env";

export const docsRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

docsRoutes.get(
  "/docs",
  swaggerUI({
    url: "/v1/openapi.json",
    persistAuthorization: true,
  }),
);

docsRoutes.get("/swagger", (c) => c.redirect("/v1/docs", 302));
