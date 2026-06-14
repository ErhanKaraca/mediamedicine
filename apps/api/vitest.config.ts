import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            SUPABASE_URL: "http://127.0.0.1:54321",
            SUPABASE_ANON_KEY: "test-anon-key",
            SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
            SUPABASE_JWT_SECRET: "super-secret-jwt-token-with-at-least-32-characters-long",
            ENVIRONMENT: "development",
            CORS_ORIGINS: "http://localhost:3000",
          },
        },
      },
    },
  },
});
