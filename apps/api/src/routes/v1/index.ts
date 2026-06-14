import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppVariables, Env } from "../../env";
import { authRoutes } from "./auth";
import { feedRoutes, profileRoutes } from "./feed";
import { healthRoutes } from "./health";
import { meRoutes } from "./me";
import { specialtyRoutes } from "./specialties";
import { writeRoutes } from "./write";

export function createV1Router() {
  const v1 = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

  v1.route("/", healthRoutes);
  v1.route("/", authRoutes);
  v1.route("/", meRoutes);
  v1.route("/", feedRoutes);
  v1.route("/", profileRoutes);
  v1.route("/", specialtyRoutes);
  v1.route("/", writeRoutes);

  v1.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "MediaMedicine API",
      version: "1.0.0",
      description: "Cloudflare Workers API for MediaMedicine social platform",
    },
    servers: [{ url: "/v1", description: "API v1" }],
    tags: [
      { name: "System" },
      { name: "Auth" },
      { name: "User" },
      { name: "Feed" },
      { name: "Profiles" },
      { name: "Catalog" },
      { name: "internal-write" },
    ],
  });

  return v1;
}

export const v1Router = createV1Router();
