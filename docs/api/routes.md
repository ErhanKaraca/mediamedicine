# API Route Haritası

Kaynak: [`packages/shared/src/edge-map.ts`](../../packages/shared/src/edge-map.ts)

## Sistem ve auth

| Method | REST path | Hedef |
|--------|-----------|-------|
| GET | `/v1/health` | Worker (Supabase ping) |
| GET | `/v1/openapi.json` | OpenAPI spec |
| POST | `/v1/auth/otp/send` | GoTrue OTP (always 200) |
| POST | `/v1/auth/otp/verify` | GoTrue verify → session |
| POST | `/v1/auth/refresh` | GoTrue refresh |
| POST | `/v1/auth/logout` | GoTrue logout (`scope`) |
| GET | `/v1/auth/me` | GoTrue user |
| GET | `/v1/auth/sessions` | Admin session list (KV cache) |
| DELETE | `/v1/auth/sessions/:sessionId` | Revoke session |
| GET | `/v1/auth/oauth/:provider` | OAuth start |
| GET | `/v1/auth/callback` | OAuth callback |
| PATCH | `/v1/auth/email` | GoTrue email change |

## Okuma (PostgREST, RLS)

| Method | REST path | Açıklama |
|--------|-----------|----------|
| GET | `/v1/me` | Auth user + profiller + settings |
| GET | `/v1/me/profiles` | Sahip olunan profiller |
| GET | `/v1/feed/groups/{slug}` | Grup kronolojik feed (keyset cursor) |
| GET | `/v1/profiles/{slug}` | Profil detayı |
| GET | `/v1/specialties` | Uzmanlık kataloğu (public) |

## Yazma — Edge function proxy

Internal function'lar **expose edilmez**: `emit-notification`, `communication-dispatch`, `content-pipeline-collect`, `health`.

| Method | REST path | Edge function |
|--------|-----------|---------------|
| POST | `/v1/posts` | create-post |
| PATCH | `/v1/posts/:id` | edit-post |
| POST | `/v1/posts/:id/comments` | create-comment |
| POST | `/v1/posts/:id/reactions` | toggle-reaction |
| POST | `/v1/feed/impressions` | record-feed-impressions |
| POST | `/v1/media/upload-init` | media-upload-init |
| POST | `/v1/media/finalize` | media-finalize |
| POST | `/v1/social/follow` | toggle-follow |
| POST | `/v1/social/block` | toggle-block |
| POST | `/v1/groups/:groupId/membership` | manage-group-membership |
| POST | `/v1/pages` | create-page |
| POST | `/v1/reports` | submit-report |
| POST | `/v1/professional-applications` | submit-professional-application |
| POST | `/v1/staff/professional-applications/:id/review` | review-professional-application |
| POST | `/v1/staff/moderation` | moderate-target |
| POST | `/v1/devices` | register-device |
| POST | `/v1/conversations` | get-or-create-conversation |
| POST | `/v1/conversations/:id/messages` | send-message |
| PATCH | `/v1/conversations/:id/messages/:messageId` | edit-message |
| DELETE | `/v1/conversations/:id/messages/:messageId` | delete-message |
| POST | `/v1/conversations/:id/read` | mark-conversation-read |
| POST | `/v1/conversations/:id/leave` | leave-conversation |
| POST | `/v1/account/delete` | delete-account |
| POST | `/v1/link-preview` | link-preview (auth optional) |

## Proxy kuralları

- Kullanıcı JWT'si `Authorization: Bearer` olarak edge'e iletilir.
- `Idempotency-Key` ve `X-Request-Id` header'ları forward edilir.
- DELETE route'ları edge function'lara POST olarak iletilir (edge handler'lar POST bekler).
- Path parametreleri JSON body ile birleştirilir (camelCase öncelikli).

## Faz D (planlanan)

| Method | REST path | Açıklama |
|--------|-----------|----------|
| GET | `/v1/feed/home` | 5-pool mixer + FeedSession DO |
