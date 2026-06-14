import type { Env } from "../env";

/**
 * Fire-and-forget analytics event for new session detection.
 * Full emit-notification integration deferred until security.new_session event type exists.
 */
export function recordNewSessionEvent(
  env: Env,
  userId: string,
  platform: string | undefined,
  deviceName: string | undefined,
): void {
  if (!env.ANALYTICS) return;
  try {
    env.ANALYTICS.writeDataPoint({
      blobs: ["auth", "new_session", userId, platform ?? "unknown", deviceName ?? ""],
      doubles: [Date.now()],
      indexes: ["auth"],
    });
  } catch {
    // non-blocking
  }
}
