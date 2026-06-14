export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  ENVIRONMENT: string;
  CORS_ORIGINS: string;
  RATE_LIMITER: DurableObjectNamespace;
  IDEMPOTENCY: DurableObjectNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
}

export type AppVariables = {
  requestId: string;
  userId?: string;
  accessToken?: string;
};

export const API_VERSION = "v1";
