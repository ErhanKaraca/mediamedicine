const REFRESH_COOKIE = "mm_refresh_token";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export function refreshCookieHeader(refreshToken: string, secure: boolean): string {
  const parts = [
    `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`,
    "HttpOnly",
    "Path=/v1/auth",
    "SameSite=Lax",
    `Max-Age=${REFRESH_MAX_AGE}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearRefreshCookieHeader(secure: boolean): string {
  const parts = [`${REFRESH_COOKIE}=`, "HttpOnly", "Path=/v1/auth", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readRefreshCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === REFRESH_COOKIE) {
      const value = rest.join("=");
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
}

export function isSecureRequest(url: string): boolean {
  return url.startsWith("https://");
}

export function shouldUseRefreshCookie(platform: string | undefined, preferCookie: boolean): boolean {
  return preferCookie || platform === "web";
}

export { REFRESH_COOKIE };
