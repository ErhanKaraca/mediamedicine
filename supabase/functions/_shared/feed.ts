/** Feed ranking constants — mirror for packages/shared/config/feed.ts when monorepo is wired. */

export const MAX_SPECIALTIES_PER_POST = 3;
export const MAX_USER_SPECIALTIES = 20;

export const CONTENT_TYPES = [
  "case_study",
  "research_summary",
  "clinical_question",
  "discussion",
  "guideline_update",
  "drug_update",
  "patient_education",
  "conference_summary",
] as const;

export type ContentType = typeof CONTENT_TYPES[number];

export const ACADEMIC_CONTENT_TYPES: ContentType[] = [
  "guideline_update",
  "drug_update",
  "research_summary",
];

/** MQS component weights (informational — DB function is source of truth on write). */
export const MQS_WEIGHTS = {
  clinicalGuideline: 40,
  doiPmidPmcid: 30,
  anyEvidence: 15,
  verified: 10,
  trustTier: { verifiedPro: 5, pro: 3, page: 4, user: 1 },
} as const;

export const DISCOVERY_MIN_QUALITY_SCORE = 40;
