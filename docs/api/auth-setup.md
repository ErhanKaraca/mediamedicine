# Auth Setup — Supabase mm-prod Checklist

Production (`mm-prod`) Dashboard yapılandırması. Worker secrets ayrı — bkz. [`cloudflare-ci.md`](./cloudflare-ci.md).

## Authentication → Providers

- [ ] **Email** enabled
- [ ] **Email OTP** enabled (`otp_length = 6`, `otp_expiry` — local ref: `supabase/config.toml`)
- [ ] **Password signups disabled** (passwordless only)
- [ ] **Confirm email**: OTP verify ile birleşik; ayrı confirm link gerekmez
- [ ] **Google OAuth** — Client ID/Secret, redirect: `https://api.mediamedicine.net/v1/auth/callback`
- [ ] **Apple OAuth** — Services ID, redirect aynı

## Authentication → URL Configuration

- [ ] **Site URL**: `https://app.mediamedicine.net` (veya production web URL)
- [ ] **Redirect URLs** allowlist:
  - `https://api.mediamedicine.net/v1/auth/callback`
  - `https://app.mediamedicine.net/**`

## Authentication → Email (SMTP)

- [ ] Production SMTP provider (SendGrid, Resend, vb.)
- [ ] From address doğrulanmış
- [ ] OTP e-posta template test edildi

## Authentication → Security

- [ ] **Refresh token rotation** enabled (`enable_refresh_token_rotation = true`)
- [ ] **Refresh token reuse interval** — `config.toml` ref: 10s
- [ ] GoTrue OTP rate limits — Dashboard'da per-email limit (API yalnızca IP limit uygular)

## Cloudflare Worker

- [ ] KV namespace `SESSION_CACHE` bound (session list 30s cache)
- [ ] Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

## Database migration

- [ ] `20260621000001_user_devices_session_metadata.sql` applied — session metadata on `user_devices`

## Doğrulama

1. `POST /v1/auth/otp/send` unknown email → **200**
2. Verify → `GET /v1/auth/me` → profiles via `GET /v1/me`
3. İkinci cihaz verify → `GET /v1/auth/sessions` iki kayıt
4. `DELETE /v1/auth/sessions/:id` → o cihaz refresh ölür
5. `POST /v1/auth/logout` `{ "scope": "others" }` → diğer oturumlar kapanır
6. Google OAuth uçtan uca callback

## advices.md cross-reference

| Konu | Ref |
|------|-----|
| No user_auth_sessions | §8.1 |
| Enumeration-safe OTP send | §8.2 |
| Session list KV cache | §8.3 |
| OAuth PKCE cookie | §8.4 |
| LRU max sessions | §8.5 |
| logout scope=others | §8.6 |
| GDPR delete-account | §3.2 |
