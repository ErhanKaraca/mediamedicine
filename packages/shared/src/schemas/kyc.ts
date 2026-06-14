import { z } from "zod";

export const KycCaseTypeSchema = z.object({
  code: z.string(),
  version: z.number(),
  target_entity_type: z.enum(["profile", "page"]),
  schema: z.record(z.unknown()),
  required_document_types: z.array(z.string()),
  is_current: z.boolean(),
});

export const KycCaseTypesResponseSchema = z.object({
  items: z.array(KycCaseTypeSchema),
});

export const KycDocumentSchema = z.object({
  id: z.string().uuid(),
  documentType: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]),
  userNote: z.string().nullable().optional(),
  staffNote: z.string().nullable().optional(),
  uploadedAt: z.string(),
});

export const KycCaseSchema = z.object({
  id: z.string().uuid(),
  caseType: z.string(),
  caseTypeVersion: z.number(),
  targetEntityType: z.enum(["profile", "page"]),
  status: z.string(),
  payload: z.record(z.unknown()),
  reviewNotes: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  documents: z.array(KycDocumentSchema).optional(),
});

export const KycCasesResponseSchema = z.object({
  items: z.array(KycCaseSchema),
});

export const CreateKycCaseBodySchema = z.object({
  caseType: z.string(),
  profileId: z.string().uuid().optional(),
  payload: z.record(z.unknown()).optional(),
});

export const UpdateKycCaseBodySchema = z.object({
  payload: z.record(z.unknown()),
});

export const AttachKycDocumentBodySchema = z.object({
  documentType: z.string(),
  storagePath: z.string(),
  note: z.string().max(500).optional(),
});

export const KycReviewBodySchema = z.object({
  decision: z.enum(["approved", "rejected", "resubmit_required"]),
  notes: z.string().optional(),
  documentDecisions: z
    .array(
      z.object({
        documentId: z.string().uuid(),
        status: z.enum(["accepted", "rejected"]),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

export const ProfessionalUpgradeResponseSchema = z.object({
  eligible: z.boolean(),
  activeCase: KycCaseSchema.nullable(),
  history: z.array(KycCaseSchema),
});

export const KycUploadInitBodySchema = z.object({
  caseId: z.string().uuid(),
  documentType: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().positive(),
  originalName: z.string(),
});

export const KycUploadInitResponseSchema = z.object({
  storagePath: z.string(),
  signedUrl: z.string(),
  token: z.string(),
});

export const AccountExportResponseSchema = z.object({
  exportId: z.string().uuid(),
  status: z.string(),
});

export type KycCase = z.infer<typeof KycCaseSchema>;
