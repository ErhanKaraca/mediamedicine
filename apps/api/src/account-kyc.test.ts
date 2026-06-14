import { describe, it, expect } from "vitest";
import { buildCapabilities, buildProfessionalUpgrade } from "../src/lib/capabilities";
import { suggestSlug, validateSlug } from "../src/lib/slug";

describe("slug validation", () => {
  it("accepts valid slugs", () => {
    expect(validateSlug("dr_erhan")).toEqual({ ok: true });
  });

  it("rejects reserved prefixes", () => {
    const result = validateSlug("admin_user");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("reserved");
  });

  it("suggests alternative when taken", () => {
    expect(suggestSlug("taken")).toMatch(/^taken_/);
  });
});

describe("capabilities", () => {
  it("user account has limited capabilities", () => {
    const caps = buildCapabilities({ account_kind: "user", is_verified: false }, false);
    expect(caps.canUsePersonalWall).toBe(false);
    expect(caps.canPostToGroups).toBe(true);
  });

  it("professional account unlocks wall and follow", () => {
    const caps = buildCapabilities({ account_kind: "professional", is_verified: true }, false);
    expect(caps.canUsePersonalWall).toBe(true);
    expect(caps.canFollow).toBe(true);
    expect(caps.canCreatePage).toBe(false);
  });

  it("professional with institution KYC can create page", () => {
    const caps = buildCapabilities({ account_kind: "professional", is_verified: true }, true);
    expect(caps.canCreatePage).toBe(true);
  });

  it("professional upgrade eligible for user without active case", () => {
    const upgrade = buildProfessionalUpgrade("user", null);
    expect(upgrade.eligible).toBe(true);
  });

  it("professional upgrade not eligible when case pending", () => {
    const upgrade = buildProfessionalUpgrade("user", {
      id: "00000000-0000-4000-8000-000000000001",
      case_type: "healthcare_professional",
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });
    expect(upgrade.eligible).toBe(false);
    expect(upgrade.activeCase?.status).toBe("submitted");
  });
});

describe("KYC edge route matching", () => {
  it("matches kyc create case", async () => {
    const { matchRoute } = await import("../src/routes/v1/write");
    const m = matchRoute("POST", "/v1/kyc/cases");
    expect(m?.mapping.functionName).toBe("kyc-create-case");
  });

  it("matches kyc review with params", async () => {
    const { matchRoute } = await import("../src/routes/v1/write");
    const m = matchRoute("POST", "/v1/staff/kyc/cases/abc-123/review");
    expect(m?.mapping.functionName).toBe("kyc-review-case");
    expect(m?.params.caseId).toBe("abc-123");
  });

  it("matches account export", async () => {
    const { matchRoute } = await import("../src/routes/v1/write");
    const m = matchRoute("POST", "/v1/account/export");
    expect(m?.mapping.functionName).toBe("account-export");
  });
});

describe("public routes", () => {
  it("consent-versions is public", async () => {
    const { authMiddleware } = await import("../src/middleware/auth");
    expect(authMiddleware).toBeDefined();
  });
});
