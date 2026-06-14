import { ApiError } from "@mediamedicine/shared/errors";
import { createMiddleware } from "hono/factory";
import type { AppVariables, Env } from "../env";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const idempotencyMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    if (!MUTATING.has(c.req.method)) {
      await next();
      return;
    }

    const key = c.req.header("Idempotency-Key");
    if (!key) {
      await next();
      return;
    }

    if (key.length > 128) {
      throw new ApiError("validation_error", "Idempotency-Key too long", 400);
    }

    const userId = c.get("userId") ?? "anon";
    const path = new URL(c.req.url).pathname;
    const storeKey = `${userId}:${path}:${key}`;

    const id = c.env.IDEMPOTENCY.idFromName(storeKey);
    const stub = c.env.IDEMPOTENCY.get(id);

    const claimRes = await stub.fetch("https://idempotency/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ttlSeconds: 86400 }),
    });

    const claim = (await claimRes.json()) as {
      status: "new" | "completed" | "in_progress";
      response?: { status: number; body: string };
    };

    if (claim.status === "completed" && claim.response) {
      return new Response(claim.response.body, {
        status: claim.response.status,
        headers: { "Content-Type": "application/json", "X-Idempotent-Replay": "true" },
      });
    }

    if (claim.status === "in_progress") {
      throw new ApiError("idempotency_conflict", "Request with same Idempotency-Key in progress", 409);
    }

    await next();

    const res = c.res;
    const body = await res.clone().text();
    await stub.fetch("https://idempotency/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: res.status, body }),
    });

    return new Response(body, {
      status: res.status,
      headers: res.headers,
    });
  },
);
