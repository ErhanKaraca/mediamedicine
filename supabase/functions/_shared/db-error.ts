import type { PostgrestError } from "npm:@supabase/supabase-js@2";

export interface MappedDbError {
  code: string;
  message: string;
  status: number;
}

export function mapDbError(error: PostgrestError | { code?: string; message?: string } | null): MappedDbError {
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

export function dbErrorResponse(error: PostgrestError | { code?: string; message?: string } | null) {
  const mapped = mapDbError(error);
  return { ...mapped, raw: error?.message };
}
