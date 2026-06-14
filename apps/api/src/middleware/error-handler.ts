import { ApiError, isApiError } from "@mediamedicine/shared/errors";
import type { ErrorHandler } from "hono";
import type { AppVariables, Env } from "../env";
import { createLogger } from "../lib/logger";

export const errorHandler: ErrorHandler<{ Bindings: Env; Variables: AppVariables }> = (err, c) => {
  const requestId = c.get("requestId") ?? crypto.randomUUID();
  const log = createLogger(requestId);

  if (isApiError(err)) {
    if (err.status >= 500) log.error(err.message, { code: err.code });
    return c.json(err.toJSON(requestId), err.status as 400);
  }

  if (err instanceof Error && err.name === "ZodError") {
    return c.json(
      new ApiError("validation_error", "Invalid request body", 400, err).toJSON(requestId),
      400,
    );
  }

  log.error(err instanceof Error ? err.message : "Unknown error");
  return c.json(new ApiError("internal_error", "Internal server error", 500).toJSON(requestId), 500);
};
