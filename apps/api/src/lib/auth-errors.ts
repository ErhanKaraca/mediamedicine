import { ApiError } from "@mediamedicine/shared/errors";

export interface GoTrueErrorBody {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

export interface GoTrueSessionBody extends GoTrueErrorBody {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id?: string;
    email?: string;
    email_confirmed_at?: string | null;
    created_at?: string;
  };
}

export function mapGoTrueError(status: number, data: GoTrueErrorBody): ApiError {
  const message =
    data.error_description ?? data.msg ?? data.message ?? data.error ?? "Authentication failed";

  if (status === 429) {
    return new ApiError("rate_limited", message, 429);
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("invalid") &&
    (lower.includes("otp") || lower.includes("token") || lower.includes("code"))
  ) {
    return new ApiError("invalid_otp", "Invalid or expired verification code", 401);
  }
  if (lower.includes("user not found") || lower.includes("no user found")) {
    return new ApiError("user_not_found", "No account found for this email", 404);
  }
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return new ApiError("user_not_found", "No account found for this email", 404);
  }
  if (lower.includes("email not confirmed")) {
    return new ApiError("auth_failed", message, 403);
  }

  if (status === 400) {
    return new ApiError("validation_error", message, 400);
  }
  if (status === 403) {
    return new ApiError("forbidden", message, 403);
  }
  if (status === 404) {
    return new ApiError("user_not_found", message, 404);
  }

  return new ApiError("auth_failed", message, status >= 500 ? 502 : 401);
}

export function intentToCreateUser(intent: "signup" | "login" | "auto"): boolean {
  if (intent === "signup") return true;
  if (intent === "login") return false;
  return true;
}

export const OTP_SEND_SUCCESS_MESSAGE =
  "If this email is eligible, a verification code was sent.";

export const EMAIL_CHANGE_MESSAGE =
  "If the address is valid, a confirmation link was sent to the new email.";
