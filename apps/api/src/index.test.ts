import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("API smoke", () => {
  it("GET / returns service info", async () => {
    const req = new Request("http://localhost/");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { service: string };
    expect(body.service).toBe("mediamedicine-api");
  });

  it("GET /v1/health returns ok", async () => {
    const req = new Request("http://localhost/v1/health");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("v1");
  });

  it("sets X-Request-Id header", async () => {
    const req = new Request("http://localhost/v1/health");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("protected route returns 401 without token", async () => {
    const req = new Request("http://localhost/v1/me");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });
});

describe("edge route matching", () => {
  it("matches create-post route", async () => {
    const { matchRoute } = await import("../src/routes/v1/write");
    const m = matchRoute("POST", "/v1/posts");
    expect(m?.mapping.functionName).toBe("create-post");
  });

  it("matches send-message with params", async () => {
    const { matchRoute } = await import("../src/routes/v1/write");
    const m = matchRoute("POST", "/v1/conversations/abc-123/messages");
    expect(m?.mapping.functionName).toBe("send-message");
    expect(m?.params.id).toBe("abc-123");
  });
});

describe("RateLimiter DO", () => {
  it("allows requests under limit", async () => {
    const { RateLimiter } = await import("../src/durable-objects/rate-limiter");
    const doInstance = new RateLimiter({} as DurableObjectState);
    const res = await doInstance.fetch(
      new Request("https://rate-limiter/check", {
        method: "POST",
        body: JSON.stringify({ limit: 5, windowSeconds: 60 }),
      }),
    );
    const body = (await res.json()) as { allowed: boolean };
    expect(body.allowed).toBe(true);
  });
});

describe("IdempotencyStore DO", () => {
  it("claims and completes", async () => {
    const { IdempotencyStore } = await import("../src/durable-objects/idempotency-store");
    const store = new IdempotencyStore({} as DurableObjectState);

    const claim = await store.fetch(
      new Request("https://idempotency/claim", { method: "POST", body: JSON.stringify({}) }),
    );
    expect((await claim.json() as { status: string }).status).toBe("new");

    await store.fetch(
      new Request("https://idempotency/complete", {
        method: "POST",
        body: JSON.stringify({ status: 200, body: '{"ok":true}' }),
      }),
    );

    const replay = await store.fetch(
      new Request("https://idempotency/claim", { method: "POST", body: JSON.stringify({}) }),
    );
    const replayBody = (await replay.json()) as { status: string; response?: { body: string } };
    expect(replayBody.status).toBe("completed");
    expect(replayBody.response?.body).toBe('{"ok":true}');
  });
});
