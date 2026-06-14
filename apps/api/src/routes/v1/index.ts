import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppVariables, Env } from "../../env";
import { authRoutes } from "./auth";
import { docsRoutes } from "./docs";
import { feedRoutes, profileRoutes } from "./feed";
import { healthRoutes } from "./health";
import { meRoutes } from "./me";
import { specialtyRoutes } from "./specialties";
import { writeRoutes } from "./write";

export function createV1Router() {
  const v1 = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

  v1.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Access token from POST /v1/auth/login or /v1/auth/signup",
  });

  v1.route("/", healthRoutes);
  v1.route("/", authRoutes);
  v1.route("/", meRoutes);
  v1.route("/", feedRoutes);
  v1.route("/", profileRoutes);
  v1.route("/", specialtyRoutes);
  v1.route("/", docsRoutes);
  v1.route("/", writeRoutes);

  v1.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "MediaMedicine API",
      version: "1.0.0",
      description:
        "Cloudflare Workers REST API for MediaMedicine. Interactive docs: GET /v1/docs",
    },
    servers: [
      { url: "https://api.mediamedicine.net/v1", description: "Production" },
      { url: "http://127.0.0.1:8787/v1", description: "Local (wrangler dev)" },
    ],
    tags: [
      { name: "System", description: "Health and metadata" },
      { name: "Auth", description: "Signup, login, refresh, logout (GoTrue proxy)" },
      { name: "User", description: "Current user and profiles" },
      { name: "Feed", description: "Group feed reads" },
      { name: "Profiles", description: "Public profile reads" },
      { name: "Catalog", description: "Reference data" },
    ],
  });

  return v1;
}

export const v1Router = createV1Router();
