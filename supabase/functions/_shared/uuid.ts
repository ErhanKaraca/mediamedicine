const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Returns the first invalid field name, or null if all valid. */
export function findInvalidUuidField(
  fields: Record<string, string | undefined>,
): string | null {
  for (const [name, value] of Object.entries(fields)) {
    if (!value || !isValidUuid(value)) return name;
  }
  return null;
}
