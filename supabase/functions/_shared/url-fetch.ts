/** SSRF guards for link-preview fetch. */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function isUrlFetchAllowed(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) return false;

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return false;
  if (host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (isPrivateIpv4(host)) return false;

  // IPv6 literal private ranges — basic block
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return false;
  }

  return true;
}

export async function fetchWithRedirectLimit(
  url: string,
  maxRedirects = 3,
): Promise<Response> {
  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const parsed = new URL(current);
    if (!isUrlFetchAllowed(parsed)) {
      throw new Error("blocked_url");
    }

    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "MediaMedicineBot/1.0 (+link-preview)" },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location || i === maxRedirects) {
        throw new Error("too_many_redirects");
      }
      current = new URL(location, current).toString();
      continue;
    }

    return res;
  }

  throw new Error("too_many_redirects");
}
