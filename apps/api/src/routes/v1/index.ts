import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppVariables, Env } from "../../env";
import { authRoutes } from "./auth";
import { docsRoutes } from "./docs";
import { feedRoutes, profileRoutes as publicProfileRoutes } from "./feed";
import { healthRoutes } from "./health";
import { meRoutes } from "./me";
import { profileRoutes } from "./profile";
import { kycRoutes } from "./kyc";
import { specialtyRoutes } from "./specialties";
import { writeRoutes } from "./write";

export function createV1Router() {
  const v1 = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

  v1.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Access token from POST /v1/auth/otp/verify or OAuth callback",
  });

  v1.route("/", healthRoutes);
  v1.route("/", authRoutes);
  v1.route("/", meRoutes);
  v1.route("/", profileRoutes);
  v1.route("/", kycRoutes);
  v1.route("/", feedRoutes);
  v1.route("/", publicProfileRoutes);
  v1.route("/", specialtyRoutes);
  v1.route("/", docsRoutes);

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
      { name: "Auth", description: "Passwordless OTP, OAuth, sessions, logout (GoTrue proxy)" },
      { name: "User", description: "Current user and profiles" },
      { name: "Legal", description: "Consent and privacy" },
      { name: "KYC", description: "Know your customer verification" },
      { name: "Privacy", description: "Data export and account deletion" },
      { name: "Feed", description: "Group feed reads" },
      { name: "Profiles", description: "Public profile reads" },
      { name: "Catalog", description: "Reference data" },
    ],
  });

  v1.route("/", writeRoutes);

  return v1;
}

export const v1Router = createV1Router();
