export interface MappedDbError {
  code: string;
  message: string;
  status: number;
}

export interface PostgrestLikeError {
  code?: string;
  message?: string;
}

export function mapDbError(error: PostgrestLikeError | null): MappedDbError {
  const pgCode = error?.code ?? "";
  switch (pgCode) {
    case "23505":
      return { code: "duplicate", message: "Resource already exists", status: 409 };
    case "23503":
      return { code: "reference_invalid", message: "Referenced resource not found", status: 400 };
    case "23514":
      return { code: "constraint_violation", message: "Invalid data", status: 400 };
    case "42501":
      return { code: "forbidden", message: "Permission denied", status: 403 };
    default:
      if (error?.message?.includes("duplicate key")) {
        return { code: "duplicate", message: "Resource already exists", status: 409 };
      }
      return { code: "database_error", message: "Operation failed", status: 400 };
  }
}

export const ERROR_CODES = {
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  not_found: "not_found",
  validation_error: "validation_error",
  rate_limited: "rate_limited",
  idempotency_conflict: "idempotency_conflict",
  internal_error: "internal_error",
  method_not_allowed: "method_not_allowed",
  auth_failed: "auth_failed",
  duplicate: "duplicate",
  reference_invalid: "reference_invalid",
  constraint_violation: "constraint_violation",
  database_error: "database_error",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON(requestId?: string): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(requestId ? { requestId } : {}),
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
