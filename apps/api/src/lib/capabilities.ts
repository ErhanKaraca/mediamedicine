export interface KycCaseRow {
  id: string;
  case_type: string;
  status: string;
  submitted_at: string | null;
}

export interface ProfileRow {
  account_kind: "user" | "professional" | "page";
  is_verified: boolean;
}

export function buildCapabilities(profile: ProfileRow, institutionKycApproved: boolean) {
  const isProfessional = profile.account_kind === "professional";
  return {
    accountKind: profile.account_kind,
    isVerified: profile.is_verified,
    canPostToGroups: true,
    canUsePersonalWall: isProfessional,
    canFollow: isProfessional,
    canCreatePage: isProfessional && institutionKycApproved,
  };
}

export function buildProfessionalUpgrade(
  accountKind: string,
  activeCase: KycCaseRow | null,
) {
  const terminal = new Set(["approved", "rejected", "withdrawn"]);
  const eligible =
    accountKind === "user" &&
    (!activeCase || terminal.has(activeCase.status));

  return {
    eligible,
    activeCase:
      activeCase && !terminal.has(activeCase.status)
        ? {
            id: activeCase.id,
            status: activeCase.status,
            submittedAt: activeCase.submitted_at,
          }
        : activeCase?.status === "approved" || activeCase?.status === "rejected"
          ? null
          : activeCase
            ? {
                id: activeCase.id,
                status: activeCase.status,
                submittedAt: activeCase.submitted_at,
              }
            : null,
  };
}
