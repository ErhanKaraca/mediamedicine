const RESERVED_PREFIXES = [
  "admin",
  "api",
  "auth",
  "staff",
  "system",
  "support",
  "help",
  "www",
  "app",
  "kyc",
  "me",
  "feed",
  "pages",
  "groups",
];

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: string } {
  if (slug.length < 3 || slug.length > 40) {
    return { ok: false, reason: "invalid_length" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return { ok: false, reason: "invalid_format" };
  }
  const lower = slug.toLowerCase();
  for (const prefix of RESERVED_PREFIXES) {
    if (lower === prefix || lower.startsWith(`${prefix}_`) || lower.startsWith(`${prefix}-`)) {
      return { ok: false, reason: "reserved" };
    }
  }
  return { ok: true };
}

export function suggestSlug(slug: string): string {
  return `${slug}_${Math.random().toString(36).slice(2, 6)}`;
}
