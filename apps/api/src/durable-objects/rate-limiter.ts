export class RateLimiter implements DurableObject {
  private counts = new Map<string, { count: number; windowStart: number }>();

  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== "/check" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }

    const body = (await request.json()) as { limit: number; windowSeconds: number };
    const now = Date.now();
    const windowMs = body.windowSeconds * 1000;
    const bucketKey = "default";

    let bucket = this.counts.get(bucketKey);
    if (!bucket || now - bucket.windowStart >= windowMs) {
      bucket = { count: 0, windowStart: now };
    }

    bucket.count += 1;
    this.counts.set(bucketKey, bucket);

    const resetAt = Math.ceil((bucket.windowStart + windowMs) / 1000);
    const allowed = bucket.count <= body.limit;
    const remaining = Math.max(0, body.limit - bucket.count);

    return Response.json({ allowed, remaining, resetAt });
  }
}
