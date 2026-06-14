# Account & Profile API

Composable endpoints for profile, settings, specialties, consent, and capabilities. No server-enforced onboarding order.

## Profile

| Method | Path | Auth |
|--------|------|------|
| PATCH | `/v1/me/profile` | Bearer |
| GET | `/v1/me/slug-available?slug=` | Bearer |

## Settings

| Method | Path | Auth |
|--------|------|------|
| PATCH | `/v1/me/settings` | Bearer |

## Specialties

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/v1/me/specialties` | Bearer | |
| PUT | `/v1/me/specialties` | Bearer | Min 1 specialty; rate limit 10/hour |

## Consent

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/consent-versions` | Public |
| GET | `/v1/me/consents` | Bearer |
| POST | `/v1/me/consents` | Bearer |

## Capabilities

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/me/capabilities` | Bearer |

Returns derived flags (`canUsePersonalWall`, `canFollow`, `canCreatePage`, etc.) and `professionalUpgrade` status. Mobile clients should poll on app foreground.

## Account read

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/me` | Bearer |
| GET | `/v1/me/profiles` | Bearer |
