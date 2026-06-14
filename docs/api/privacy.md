# Privacy API (GDPR / KVKK)

## Data export

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/account/export` | Bearer |
| GET | `/v1/account/export/{exportId}` | Bearer |
| GET | `/v1/account/export/{exportId}/download` | Bearer |

Export jobs are stored in `account_exports`. Processing is async via `content_pipeline_runs`.

## Account deletion

| Method | Path | Auth |
|--------|------|------|
| POST | `/v1/account/delete` | Bearer |

Request body:

```json
{
  "confirm": true,
  "otpVerifiedAt": "2026-06-14T12:00:00.000Z"
}
```

When TOTP MFA is enrolled (Auth Faz 2), use `stepUpToken` instead of `otpVerifiedAt`:

```json
{
  "confirm": true,
  "stepUpToken": "..."
}
```

Deletion is soft-delete immediately; hard-delete is scheduled after retention period (30 days).

## MFA (Auth Faz 2)

| Method | Path |
|--------|------|
| GET | `/v1/auth/mfa/factors` |
| POST | `/v1/auth/mfa/totp/enroll` |
| POST | `/v1/auth/mfa/totp/verify` |
| POST | `/v1/auth/mfa/challenge` |
| DELETE | `/v1/auth/mfa/totp/{factorId}` |

Requires Supabase Dashboard TOTP MFA enabled.
