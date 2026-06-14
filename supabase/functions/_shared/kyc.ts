export interface JsonSchema {
  required?: string[];
  properties?: Record<string, { const?: unknown }>;
}

export function validateKycPayload(
  schema: JsonSchema,
  payload: Record<string, unknown>,
): string | null {
  const required = schema.required ?? [];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      return `missing_${field}`;
    }
    if (field === "attestationAccepted" && payload[field] !== true) {
      return "attestation_required";
    }
  }
  return null;
}

export const KYC_ALLOWED_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const KYC_MAX_BYTES = 10 * 1024 * 1024;
