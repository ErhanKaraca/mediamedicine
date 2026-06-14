import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../env";

export const requestIdMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const incoming = c.req.header("X-Request-Id");
  const requestId = incoming && incoming.length <= 64 ? incoming : crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);
  await next();
});
