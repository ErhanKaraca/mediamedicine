import { handlePreflight } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  return errorResponse(
    "use_kyc_flow",
    "Professional upgrade now uses KYC. POST /v1/kyc/cases with caseType healthcare_professional",
    410,
  );
});
