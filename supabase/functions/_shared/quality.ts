import { MQS_WEIGHTS } from "./feed.ts";

export interface MqsEvidenceInput {
  sourceType: string;
  identifierType?: string | null;
}

export interface MqsAuthorInput {
  accountKind: string;
  isVerified: boolean;
}

/** Client-side MQS estimate (matches private.compute_post_quality_score in Postgres). */
export function computeMedicalQualityScore(
  evidences: MqsEvidenceInput[],
  author: MqsAuthorInput,
): number {
  let score = 0;

  if (evidences.some((e) => e.sourceType === "clinical_guideline")) {
    score += MQS_WEIGHTS.clinicalGuideline;
  }
  if (evidences.some((e) =>
    e.identifierType === "doi" || e.identifierType === "pmid" || e.identifierType === "pmcid"
  )) {
    score += MQS_WEIGHTS.doiPmidPmcid;
  }
  if (evidences.length > 0) score += MQS_WEIGHTS.anyEvidence;
  if (author.isVerified) score += MQS_WEIGHTS.verified;

  if (author.accountKind === "professional" && author.isVerified) {
    score += MQS_WEIGHTS.trustTier.verifiedPro;
  } else if (author.accountKind === "professional") {
    score += MQS_WEIGHTS.trustTier.pro;
  } else if (author.accountKind === "page") {
    score += MQS_WEIGHTS.trustTier.page;
  } else {
    score += MQS_WEIGHTS.trustTier.user;
  }

  return Math.min(score, 100);
}
