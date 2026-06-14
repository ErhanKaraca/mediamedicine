interface StoredResponse {
  status: number;
  body: string;
  completedAt: number;
}

export class IdempotencyStore implements DurableObject {
  private state: "new" | "in_progress" | "completed" = "new";
  private stored?: StoredResponse;

  constructor(_state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/claim" && request.method === "POST") {
      if (this.state === "completed" && this.stored) {
        return Response.json({
          status: "completed",
          response: { status: this.stored.status, body: this.stored.body },
        });
      }
      if (this.state === "in_progress") {
        return Response.json({ status: "in_progress" });
      }
      this.state = "in_progress";
      return Response.json({ status: "new" });
    }

    if (url.pathname === "/complete" && request.method === "POST") {
      const body = (await request.json()) as { status: number; body: string };
      this.stored = { ...body, completedAt: Date.now() };
      this.state = "completed";
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}
