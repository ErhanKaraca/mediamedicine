# Architecture Advice — Account, Profile & KYC Plan

Review of `account_profile_onboarding_kyc_a6c33e62.plan.md`.

**Overall verdict:** Plan is structurally solid. No server-side onboarding enforcement is the right call. KYC as unified gate for `account_kind` upgrades is clean. The resubmit flow is well-designed. But there are 14 gaps — some will cause bugs in production, two are schema-level and can't be patched post-deploy without a migration.

---

## What Works

- Composable endpoints with no server-enforced onboarding order — correct for this architecture.
- Capabilities derived from DB state at request time, not stored separately — avoids stale state.
- Unified KYC replacing `professional_applications` — correct consolidation.
- Partial document decisions in staff review (`documentDecisions[]`) — realistic UX.
- Resubmit only replaces rejected document types while preserving accepted ones — good.
- `user_consents` as audit trail without API enforcement — legally sufficient, not overengineered.
- PR-8 GDPR/KVKK coverage is planned, not deferred indefinitely.

---

## Issues

### 1. KYC documents in `media` table — conceptual mismatch (schema risk)

Plan: `media-upload-init` extended with `purpose: "kyc"` → files land in `kyc-documents` bucket, row in `media` table.

**Problem:** `media` table is designed around post/message media lifecycle (`processing → ready`, pipeline runs, `owner_profile_id`, `post_media` junction). KYC documents:
- Are owned by `user_id`, not `profile_id` (profile can be deleted; KYC must survive for legal retention).
- Don't go through the content pipeline — `status: processing/ready` is meaningless.
- Have their own confidentiality model (only owner + staff can read — separate from post-media RLS).
- Must survive profile soft-delete for audit purposes.

Mixing KYC documents into `media` means the content pipeline, `post_media` joins, and media status logic all need `purpose != 'kyc'` guards added everywhere.

**Recommendation:** Give KYC documents a separate table: `kyc_document_files (id, case_id, document_type, storage_path, mime_type, size_bytes, user_note, staff_note, status, uploaded_at)`. No FK to `media`. Store the signed upload URL via a dedicated `kyc-upload-init` endpoint or extend `media-upload-init` to return a separate row type. Cleaner ownership, simpler RLS.

---

### 2. `kyc-documents` bucket has no defined RLS policy (storage gap)

The plan adds a new `kyc-documents` private bucket but the current `can_read_storage_object()` function in `20260618000001` only handles `post-media`, `post-attachments`, and `message-media`. No policy is defined for `kyc-documents`.

Without a policy, either: (a) the bucket is unreadable by anyone (documents inaccessible to staff review UI), or (b) the default Supabase behavior applies (authenticated users can read everything).

**Recommendation:** Add `kyc_documents_read` storage policy to PR-1:
```sql
(bucket_id = 'kyc-documents') and (
  -- owner can read their own case documents
  exists (
    select 1 from public.kyc_documents kd
    join public.kyc_cases kc on kc.id = kd.case_id
    where kd.storage_path = name
    and kc.user_id = auth.uid()
  )
  or private.is_platform_staff(auth.uid())
)
```

---

### 3. `kyc_documents` — no "current version" marker for resubmissions (schema risk)

Plan says on resubmit: "eski rejected satır superseded; accepted belgeler dokunulmaz." But the `kyc_documents` schema has no `is_current boolean`, `superseded_at`, or `superseded_by uuid`. After two resubmissions of the same `document_type`, there are 3 rows with the same `document_type` for the same case. Staff review UI and `GET /kyc/cases/{id}` response need to know which is current.

**Recommendation:** Add `superseded_by uuid references kyc_documents(id)` to the table. When a new document is uploaded for an already-existing `document_type` on a `resubmit_required` case, the old row gets `superseded_by = new_id`. Query for current documents: `WHERE superseded_by IS NULL`.

Alternatively: `is_current boolean not null default true` with a trigger that sets old rows to `false` on insert of same `case_id + document_type`.

---

### 4. `kyc_case_types.schema jsonb` — schema versioning has no enforcement

`kyc_cases.case_type_version` references which version of the form the case was drafted under. But there's no mechanism that:
- Prevents submitting a draft created under v1 schema when v2 is now current.
- Tells the user "your draft needs to be updated."
- Validates whether a v1 payload is still acceptable for review.

If `healthcare_professional` v1 schema adds `attestationAccepted` in v2 (likely, for legal reasons), in-flight drafts silently lack it.

**Recommendation:** Add `is_current boolean not null default true` to `kyc_case_types`. On submit: validate payload against the case's locked `case_type_version` schema. If the user's draft is against a non-current version, return `409 outdated_case_type { currentVersion, requiredFields }` and require the user to update their draft. This is a minor UX burden but legally critical for consent/attestation fields.

---

### 5. Staff approval mutates `profiles` directly — no audit trail

When staff approves a KYC case:
1. `kyc_cases.status = approved`
2. `profiles.account_kind = professional, is_verified = true`

Step 2 is a direct column mutation. `profiles` has `updated_at` but no history. If an account is incorrectly approved or later needs to be reverted (fraud, license revocation), there's no record of who changed `account_kind` and when.

**Recommendation:** When writing the approval, also insert into `moderation_actions`:
```sql
insert into moderation_actions (actor_user_id, target_type, target_id, action_type, notes)
values (staff_user_id, 'profile', profile_id, 'kyc_approved', kyc_case_id::text);
```
Existing `moderation_actions` table is the right place for this. No schema change needed.

---

### 6. `POST /professional-applications` deprecation is half-done

Plan: legacy endpoint returns `409 use_kyc_flow` or internally creates a KYC case. The `professional_applications` table remains with its own schema, FK constraints, RLS policies, and edge function.

"Deprecated alias" means two code paths maintained indefinitely. The table has a `kyc_case_id` FK (nullable → required for new submissions) but old rows without `kyc_case_id` still exist. Staff review UI now needs to handle both.

**Recommendation:** In PR-5, pick one:
- **Hard cut:** Drop `professional_applications` table, migrate existing rows to KYC cases (write a migration script for existing approved/pending rows). Clean.
- **Read-only:** Add a `deprecated_at` column, block all writes via RLS (`WITH CHECK (false)`), keep rows for historical reads only. No alias endpoint needed.

Don't maintain an alias endpoint that proxies to a new system — it adds complexity with no benefit.

---

### 7. No unique constraint on active KYC cases per user per type

Nothing prevents a user from creating 10 draft `healthcare_professional` cases. The plan shows state machine transitions but no DB-level uniqueness.

**Recommendation:** Partial unique index in PR-1:
```sql
create unique index kyc_cases_one_active_per_user_type
on public.kyc_cases (user_id, case_type)
where status not in ('approved', 'rejected', 'withdrawn');
```
One active case per user per type at any time. Approved/rejected cases are closed — creating a new one is valid (re-application).

---

### 8. `kyc_cases.payload jsonb` — no DB-level required field validation

`legalFullName`, `licenseNumber`, `attestationAccepted` for `healthcare_professional` are validated at submit time in the edge function. Direct PostgREST access (service role) can insert invalid payloads. More importantly, a new required field added in case_type v2 has no enforcement if validation logic is only in the function.

**Recommendation:** Add a DB check constraint tied to `case_type`:
```sql
alter table public.kyc_cases add constraint kyc_professional_payload_required
check (
  case_type != 'healthcare_professional' or (
    payload ? 'legalFullName' and
    payload ? 'licenseNumber' and
    payload ? 'attestationAccepted'
  )
);
```
This fires on any write path, not just the Worker. Also: `attestationAccepted` should be `true` (not just present):
```sql
(payload->>'attestationAccepted')::boolean = true
```

---

### 9. `PUT /me/specialties` replace semantics — silent data loss risk

PUT replaces all specialties. A client bug sending an empty array silently deletes all specialty history. This also orphans `user_specialty_weights` computed scores (referenced in `advices.md §1.5`). No rate limit on this endpoint.

**Recommendation:**
- Require at least 1 specialty in the body (`minItems: 1` in Zod schema) — empty PUT returns `400 min_one_specialty`.
- Add idempotency key support or require confirmation header (`X-Confirm: replace-all`) for destructive operations.
- Rate limit: max 10 PUT/hour per user (specialty changes aren't frequent; abuse guard).

---

### 10. `GET /me/capabilities` marked optional — bad for mobile

Plan: `GET /me/capabilities` is optional, can be merged into `GET /me`. Mobile client (Flutter) generates typed models from OpenAPI. Every addition to `/me` response requires a new client release. The capabilities block will grow as features are added (`canCreateGroup`, `canUseFeed`, `canSendMessages`, etc.).

**Recommendation:** `GET /me/capabilities` should be a stable, defined endpoint — not optional. Keep `/me` response stable (user + profile + settings). Capabilities live at `/me/capabilities` with its own versioned schema. Mobile polls this on app foreground; web uses `/me` for the full picture. Define the OpenAPI schema for capabilities now, before clients are built.

---

### 11. Data export job has no defined persistence layer

PR-8: `POST /account/export` creates an async job returning `{ exportId, status }`. `GET /account/export/{exportId}` polls status. `GET /account/export/{exportId}/download` returns a signed URL.

Where is the export job stored? Plan doesn't define a table. Options are `content_pipeline_runs` (repurposed) or a new table. Without a defined schema, PR-8 can't be implemented consistently.

**Recommendation:** Define `account_exports` table in PR-8 migration:
```sql
create table public.account_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed','expired')),
  storage_path text,
  expires_at timestamptz,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
```
RLS: user can only read own rows. Worker processes via `content_pipeline_runs` job referencing `account_exports.id`.

---

### 12. Page–KYC link is by convention, not constraint

Plan: `POST /v1/pages { kycCaseId }` — "yalnızca onaylı institution case." But `kyc_cases` schema has no `target_entity_type` column. The link between an institution KYC case and the page it creates is implied by `intendedSlug` matching in the payload, not enforced by FK semantics.

If the `create-page` edge function just checks `kyc_cases.status = approved`, a `healthcare_professional` (individual) KYC case with `status = approved` could be passed as `kycCaseId` for page creation — wrong case type accepted.

**Recommendation:** Add `target_entity_type text check (target_entity_type in ('profile', 'page'))` to `kyc_cases`. `healthcare_professional` cases have `target_entity_type = 'profile'`. `healthcare_institution` cases have `target_entity_type = 'page'`. `create-page` validates: `case_type = 'healthcare_institution' AND target_entity_type = 'page' AND status = 'approved'`.

---

### 13. `user_consents` has no version catalog

`POST /me/consents` accepts `{ termsVersion, privacyVersion }`. No `consent_versions` table or seed. Clients can't know what the current required versions are. The API can't validate whether the submitted version is outdated.

**Recommendation:** Add a `consent_versions` seed table:
```sql
create table public.consent_versions (
  id text primary key,   -- e.g. 'terms_v1', 'privacy_v1'
  type text not null,    -- 'terms' | 'privacy'
  version text not null,
  is_current boolean not null default true,
  effective_at timestamptz not null
);
```
`GET /v1/consent-versions` (public) returns current versions. Client reads this before showing consent modal. `POST /me/consents` validates submitted versions against `is_current = true`.

---

### 14. MFA delete step-up is version-gated but fallback isn't specified

PR-8 `POST /account/delete` requires step-up: "son OTP veya MFA step-up." If TOTP is deferred to Auth Faz 2, delete step-up only has OTP — acceptable for v1. But the code must handle the case where TOTP is enrolled (beta users) vs. not. When TOTP is enrolled, OTP alone shouldn't be sufficient for delete.

**Recommendation:** In PR-8, step-up logic:
```
if TOTP enrolled → require TOTP AAL2 challenge
else → require fresh OTP verify (< 5 min old)
```
GoTrue exposes `auth.mfa_factors` to check enrollment status. The Worker can query this before accepting delete re-auth. Don't hardcode OTP-only — write the branch now even if TOTP path is never triggered until Auth Faz 2.

---

## Priority Order for Implementation

| Priority | Issue | Blocks |
|----------|-------|--------|
| 🔴 | Issue 2 — KYC bucket has no RLS policy | All document reads/writes broken |
| 🔴 | Issue 1 — KYC docs in `media` table | Schema tech debt, hard to undo post-deploy |
| 🔴 | Issue 3 — No superseded_by on kyc_documents | Resubmit shows wrong document |
| 🔴 | Issue 12 — No target_entity_type on kyc_cases | Wrong case type accepted for page creation |
| 🟠 | Issue 7 — No unique constraint on active cases | Duplicate active cases, state machine breaks |
| 🟠 | Issue 5 — Staff approval not logged to moderation_actions | Audit trail gap |
| 🟠 | Issue 4 — Case type version enforcement | Legal/attestation fields can be skipped |
| 🟠 | Issue 6 — professional_applications alias scope undefined | Ongoing maintenance burden |
| 🟠 | Issue 11 — account_exports table not defined | PR-8 can't start without this |
| 🟡 | Issue 8 — payload jsonb no DB constraint | Only mitigated by function validation |
| 🟡 | Issue 9 — PUT specialties silent wipe | Client bug risk |
| 🟡 | Issue 10 — capabilities endpoint optional | Mobile API contract instability |
| 🟡 | Issue 13 — No consent_versions catalog | Clients can't validate version currency |
| 🟡 — defer to Auth Faz 2 | Issue 14 — MFA step-up branch for delete | Low risk while TOTP is disabled |

---

## Summary

Plan is above average for this stage — capability model is correct, KYC state machine is sound, no server-side onboarding is the right call. The critical gaps are all in the data layer: KYC documents don't belong in the `media` table, the KYC bucket needs its own storage policy before anything can be uploaded or viewed, and document versioning (superseded_by) must be in the schema before the first resubmission case is processed. These four (Issues 1–3, 12) must be resolved in PR-1 before any KYC endpoint goes live.
