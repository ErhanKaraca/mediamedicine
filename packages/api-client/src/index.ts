import type {
  AuthLogoutBody,
  AuthMeResponse,
  AuthSession,
  AuthSessionItem,
  OtpSendBody,
  OtpVerifyBody,
} from "@mediamedicine/shared/schemas";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
  fetch?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class MediaMedicineClient {
  private accessToken?: string;
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: ApiClientOptions) {
    this.accessToken = options.accessToken;
    this.fetchFn = options.fetch ?? fetch;
  }

  setAccessToken(token: string | undefined) {
    this.accessToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.options.baseUrl.replace(/\/$/, "")}${path}`;
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (this.accessToken) {
      reqHeaders.Authorization = `Bearer ${this.accessToken}`;
    }

    const res = await this.fetchFn(url, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = (await res.json()) as T & { error?: { code: string; message: string; requestId?: string } };
    if (!res.ok) {
      const err = data.error;
      throw new ApiError(
        err?.code ?? "request_failed",
        err?.message ?? res.statusText,
        res.status,
        err?.requestId,
      );
    }
    return data;
  }

  health() {
    return this.request<{ status: string; service: string; version: string }>("GET", "/v1/health");
  }

  sendOtp(body: OtpSendBody) {
    return this.request<{ ok: true; message: string }>("POST", "/v1/auth/otp/send", body);
  }

  verifyOtp(body: OtpVerifyBody, useRefreshCookie = false) {
    return this.request<AuthSession>("POST", "/v1/auth/otp/verify", body, {
      ...(useRefreshCookie ? { "X-Use-Refresh-Cookie": "true" } : {}),
    });
  }

  refresh(refreshToken?: string, useRefreshCookie = false) {
    return this.request<AuthSession>(
      "POST",
      "/v1/auth/refresh",
      refreshToken ? { refreshToken } : {},
      useRefreshCookie ? { "X-Use-Refresh-Cookie": "true" } : undefined,
    );
  }

  logout(body: AuthLogoutBody = { scope: "local" }) {
    return this.request<{ ok: true }>("POST", "/v1/auth/logout", body);
  }

  authMe() {
    return this.request<AuthMeResponse>("GET", "/v1/auth/me");
  }

  listSessions() {
    return this.request<{ items: AuthSessionItem[] }>("GET", "/v1/auth/sessions");
  }

  revokeSession(sessionId: string) {
    return this.request<{ ok: true }>("DELETE", `/v1/auth/sessions/${sessionId}`);
  }

  changeEmail(email: string) {
    return this.request<{ ok: true; message: string }>("PATCH", "/v1/auth/email", { email });
  }

  me() {
    return this.request<{ user: { id: string; email?: string }; profiles: unknown[] }>("GET", "/v1/me");
  }

  deleteAccount(confirm = true) {
    return this.request<{ status: string }>("POST", "/v1/account/delete", { confirm });
  }

  createPost(body: Record<string, unknown>, idempotencyKey?: string) {
    return this.request<unknown>("POST", "/v1/posts", body, {
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    });
  }
}

export function createClient(baseUrl: string, accessToken?: string) {
  return new MediaMedicineClient({ baseUrl, accessToken });
}
