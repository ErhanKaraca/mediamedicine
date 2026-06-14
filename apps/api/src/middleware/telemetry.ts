import { createMiddleware } from "hono/factory";
import type { AppVariables, Env } from "../env";

export const telemetryMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const start = Date.now();
    await next();
    const latency = Date.now() - start;
    const path = new URL(c.req.url).pathname;

    try {
      c.env.ANALYTICS?.writeDataPoint({
        blobs: [path, c.req.method, c.env.ENVIRONMENT],
        doubles: [latency, c.res.status],
        indexes: [c.get("userId") ?? "anonymous"],
      });
    } catch {
      // analytics is best-effort
    }
  },
);
