/**
 * Export OpenAPI spec to openapi/openapi.json (run after building shared).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Minimal static export — full spec is served at runtime from /v1/openapi.json
const spec = {
  openapi: "3.1.0",
  info: {
    title: "MediaMedicine API",
    version: "1.0.0",
    description:
      "Cloudflare Workers REST API. Live spec: GET /v1/openapi.json on deployed worker.",
  },
  servers: [{ url: "https://mediamedicine-api.workers.dev/v1" }],
  paths: {
    "/health": {
      get: { tags: ["System"], summary: "Health check" },
    },
    "/auth/signup": { post: { tags: ["Auth"], summary: "Sign up" } },
    "/auth/login": { post: { tags: ["Auth"], summary: "Log in" } },
    "/auth/refresh": { post: { tags: ["Auth"], summary: "Refresh token" } },
    "/auth/logout": { post: { tags: ["Auth"], summary: "Log out" } },
    "/me": { get: { tags: ["User"], summary: "Current user" } },
    "/feed/groups/{slug}": { get: { tags: ["Feed"], summary: "Group feed" } },
    "/specialties": { get: { tags: ["Catalog"], summary: "Specialties list" } },
  },
};

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = join(root, "openapi");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "openapi.json"), JSON.stringify(spec, null, 2));
console.log("Wrote openapi/openapi.json");
