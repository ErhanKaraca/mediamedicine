import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppVariables, Env } from "./env";
import { authMiddleware } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { telemetryMiddleware } from "./middleware/telemetry";
import { v1Router } from "./routes/v1";

export { RateLimiter } from "./durable-objects/rate-limiter";
export { IdempotencyStore } from "./durable-objects/idempotency-store";

const app = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

app.onError(errorHandler);

app.use("*", requestIdMiddleware);
app.use("*", corsMiddleware);
app.use("*", authMiddleware);
app.use("*", rateLimitMiddleware);
app.use("*", idempotencyMiddleware);
app.use("*", telemetryMiddleware);

app.route("/v1", v1Router);

app.get("/", (c) =>
  c.json({
    service: "mediamedicine-api",
    version: "v1",
    docs: "/v1/openapi.json",
  }),
);

export default app;
