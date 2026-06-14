# KYC API

Unified Know Your Customer flow for professional upgrade and institution (page) verification.

## Case types

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/kyc/case-types` | Public |

Seeded types: `healthcare_professional` (profile upgrade), `healthcare_institution` (page).

## User cases

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/me/kyc/cases` | Bearer |
| GET | `/v1/kyc/cases/{caseId}` | Bearer |
| GET | `/v1/me/professional-upgrade` | Bearer |

## Write (edge proxy)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/kyc/upload-init` | Signed upload URL for `kyc-documents` bucket |
| POST | `/v1/kyc/cases` | Create draft case |
| PATCH | `/v1/kyc/cases/{caseId}` | Update payload |
| POST | `/v1/kyc/cases/{caseId}/documents` | Attach uploaded document |
| DELETE | `/v1/kyc/cases/{caseId}/documents/{documentId}` | Remove document |
| POST | `/v1/kyc/cases/{caseId}/submit` | Submit for review |
| POST | `/v1/kyc/cases/{caseId}/withdraw` | Withdraw case |

## Staff

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/staff/kyc/cases` | Bearer (platform staff) |
| POST | `/v1/staff/kyc/cases/{caseId}/review` | Bearer (platform staff) |

Review body supports partial document decisions:

```json
{
  "decision": "resubmit_required",
  "notes": "Genel not",
  "documentDecisions": [
    { "documentId": "uuid", "status": "rejected", "note": "Belge net değil" }
  ]
}
```

## Page creation

`POST /v1/pages` requires:

- Owner `account_kind=professional`
- Approved `healthcare_institution` KYC case (`kycCaseId`)
- Optional `intendedSlug` in case payload must match page `slug`

## Legacy

`POST /v1/professional-applications` returns **410 Gone** — use KYC flow instead.

## Document storage

KYC files use dedicated `kyc-documents` bucket and `kyc_documents` table (not `media`). Resubmit uses `superseded_by` to mark replaced documents.
