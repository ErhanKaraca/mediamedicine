import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ApiError, mapDbError } from "@mediamedicine/shared/errors";
import {
  KycCaseSchema,
  KycCasesResponseSchema,
  KycCaseTypesResponseSchema,
  ProfessionalUpgradeResponseSchema,
} from "@mediamedicine/shared/schemas";
import type { AppVariables, Env } from "../../env";
import { createAnonClient, createUserClient } from "../../lib/supabase";

export const kycRoutes = new OpenAPIHono<{ Bindings: Env; Variables: AppVariables }>();

function requireAuth(c: { get: (k: "userId" | "accessToken") => string | undefined }) {
  const userId = c.get("userId");
  const accessToken = c.get("accessToken");
  if (!userId || !accessToken) throw new ApiError("unauthorized", "Not authenticated", 401);
  return { userId, accessToken };
}

function mapDocument(row: {
  id: string;
  document_type: string;
  status: string;
  user_note: string | null;
  staff_note: string | null;
  uploaded_at: string;
}) {
  return {
    id: row.id,
    documentType: row.document_type,
    status: row.status,
    userNote: row.user_note,
    staffNote: row.staff_note,
    uploadedAt: row.uploaded_at,
  };
}

function mapCase(row: {
  id: string;
  case_type: string;
  case_type_version: number;
  target_entity_type: string;
  status: string;
  payload: Record<string, unknown>;
  review_notes: string | null;
  submitted_at: string | null;
  created_at: string;
}) {
  return {
    id: row.id,
    caseType: row.case_type,
    caseTypeVersion: row.case_type_version,
    targetEntityType: row.target_entity_type,
    status: row.status,
    payload: row.payload ?? {},
    reviewNotes: row.review_notes,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

const caseTypesRoute = createRoute({
  method: "get",
  path: "/kyc/case-types",
  tags: ["KYC"],
  responses: {
    200: {
      content: { "application/json": { schema: KycCaseTypesResponseSchema } },
      description: "KYC form schemas",
    },
  },
});

kycRoutes.openapi(caseTypesRoute, async (c) => {
  const client = createAnonClient(c.env);
  const { data, error } = await client
    .from("kyc_case_types")
    .select("code, version, target_entity_type, schema, required_document_types, is_current")
    .eq("is_current", true);

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: data ?? [] });
});

const myCasesRoute = createRoute({
  method: "get",
  path: "/me/kyc/cases",
  tags: ["KYC"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional(),
      type: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: KycCasesResponseSchema } },
      description: "User KYC cases",
    },
  },
});

kycRoutes.openapi(myCasesRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const { status, type } = c.req.valid("query");
  const client = createUserClient(c.env, accessToken);

  let query = client
    .from("kyc_cases")
    .select("id, case_type, case_type_version, target_entity_type, status, payload, review_notes, submitted_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("case_type", type);

  const { data, error } = await query;
  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: (data ?? []).map(mapCase) });
});

const caseByIdRoute = createRoute({
  method: "get",
  path: "/kyc/cases/{caseId}",
  tags: ["KYC"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ caseId: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: KycCaseSchema } },
      description: "KYC case detail",
    },
  },
});

kycRoutes.openapi(caseByIdRoute, async (c) => {
  const { accessToken } = requireAuth(c);
  const { caseId } = c.req.valid("param");
  const client = createUserClient(c.env, accessToken);

  const { data: kycCase, error } = await client
    .from("kyc_cases")
    .select("id, case_type, case_type_version, target_entity_type, status, payload, review_notes, submitted_at, created_at")
    .eq("id", caseId)
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const { data: docs } = await client
    .from("kyc_documents")
    .select("id, document_type, status, user_note, staff_note, uploaded_at")
    .eq("case_id", caseId)
    .is("superseded_by", null);

  return c.json({
    ...mapCase(kycCase),
    documents: (docs ?? []).map(mapDocument),
  });
});

const professionalUpgradeRoute = createRoute({
  method: "get",
  path: "/me/professional-upgrade",
  tags: ["KYC"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: ProfessionalUpgradeResponseSchema } },
      description: "Professional upgrade shortcut",
    },
  },
});

kycRoutes.openapi(professionalUpgradeRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const client = createUserClient(c.env, accessToken);

  const { data: profile } = await client
    .from("profiles")
    .select("account_kind")
    .eq("owner_user_id", userId)
    .in("account_kind", ["user", "professional"])
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  const { data: cases, error } = await client
    .from("kyc_cases")
    .select("id, case_type, case_type_version, target_entity_type, status, payload, review_notes, submitted_at, created_at")
    .eq("user_id", userId)
    .eq("case_type", "healthcare_professional")
    .order("created_at", { ascending: false });

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  const terminal = new Set(["approved", "rejected", "withdrawn"]);
  const active = (cases ?? []).find((row) => !terminal.has(row.status)) ?? null;
  const eligible = profile?.account_kind === "user" && (!active || terminal.has(active.status));

  return c.json({
    eligible,
    activeCase: active ? mapCase(active) : null,
    history: (cases ?? []).map(mapCase),
  });
});

const accountExportDownloadRoute = createRoute({
  method: "get",
  path: "/account/export/{exportId}/download",
  tags: ["Privacy"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ exportId: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            downloadUrl: z.string().url(),
            expiresIn: z.number(),
          }),
        },
      },
      description: "Signed download URL",
    },
  },
});

kycRoutes.openapi(accountExportDownloadRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const { exportId } = c.req.valid("param");
  const client = createUserClient(c.env, accessToken);

  const { data, error } = await client
    .from("account_exports")
    .select("id, user_id, status, storage_path, expires_at")
    .eq("id", exportId)
    .eq("user_id", userId)
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }
  if (data.status !== "ready" || !data.storage_path) {
    throw new ApiError("not_ready", "Export is not ready", 409);
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new ApiError("expired", "Export has expired", 410);
  }

  const { data: signed, error: signErr } = await client.storage
    .from("account-exports")
    .createSignedUrl(data.storage_path, 3600);

  if (signErr || !signed) {
    throw new ApiError("signed_url_failed", signErr?.message ?? "Could not create download URL", 500);
  }

  return c.json({ downloadUrl: signed.signedUrl, expiresIn: 3600 });
});

const staffKycCasesRoute = createRoute({
  method: "get",
  path: "/staff/kyc/cases",
  tags: ["KYC"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      status: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: KycCasesResponseSchema } },
      description: "Staff KYC queue",
    },
  },
});

kycRoutes.openapi(staffKycCasesRoute, async (c) => {
  const { accessToken } = requireAuth(c);
  const { status } = c.req.valid("query");
  const client = createUserClient(c.env, accessToken);

  let query = client
    .from("kyc_cases")
    .select("id, case_type, case_type_version, target_entity_type, status, payload, review_notes, submitted_at, created_at")
    .in("status", status ? [status] : ["submitted", "under_review", "resubmit_required"])
    .order("submitted_at", { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({ items: (data ?? []).map(mapCase) });
});

const accountExportStatusRoute = createRoute({
  method: "get",
  path: "/account/export/{exportId}",
  tags: ["Privacy"],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ exportId: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            exportId: z.string().uuid(),
            status: z.string(),
            expiresAt: z.string().nullable(),
            completedAt: z.string().nullable(),
          }),
        },
      },
      description: "Export job status",
    },
  },
});

kycRoutes.openapi(accountExportStatusRoute, async (c) => {
  const { userId, accessToken } = requireAuth(c);
  const { exportId } = c.req.valid("param");
  const client = createUserClient(c.env, accessToken);

  const { data, error } = await client
    .from("account_exports")
    .select("id, status, expires_at, completed_at")
    .eq("id", exportId)
    .eq("user_id", userId)
    .single();

  if (error) {
    const mapped = mapDbError(error);
    throw new ApiError(mapped.code, mapped.message, mapped.status);
  }

  return c.json({
    exportId: data.id,
    status: data.status,
    expiresAt: data.expires_at,
    completedAt: data.completed_at,
  });
});
