# Architecture Advice — mediamedicine Supabase Layer

Findings from full audit of 20 migrations, 23 edge functions, shared modules, RLS, storage, feed, and communication systems.

---

## 1. Schema & Data Model

### 1.1 Message attachments bypass the media table

Post media uses the `media` table + `post_media` junction (FK integrity, status tracking, storage path governance). Message attachments use raw `jsonb` on `messages.attachments` — no FK to `media`, no status tracking, orphaned files possible.

**Recommendation:** Reuse the `media` table for message attachments. Add a `message_media` junction table mirroring `post_media`.

### 1.2 `can_read_storage_object` uses LIKE on JSONB for message media

`20260618000001_supabase_layer_closure.sql:152-163`
```sql
and msg.attachments::text like '%' || m.id::text || '%'
```
A text search on a JSONB column. False positives if any UUID appears in message content. Won't use an index. Slow at scale.

**Recommendation:** Once message attachments are migrated to `message_media` table (see 1.1), this lookup becomes a clean FK join.

### 1.3 `feed_seen_items` and `feed_impressions` are unbounded

No TTL, no partition, no archival strategy. At target scale (2M users, 65k posts/day), `feed_seen_items` can reach hundreds of millions of rows within months. `feed_impressions` grows faster (multiple events per view).

**Recommendation:**
- `feed_seen_items`: add a range partition by month on `seen_at`, drop partitions older than 90 days.
- `feed_impressions`: same, or move to an analytics sink (Cloudflare Analytics Engine, BigQuery) rather than Postgres.

### 1.4 `moderation_actions.target_id` and `reports.target_id` have no FK

Both use `target_type text + target_id uuid` pattern without a FK. Content can be deleted and these rows become dangling references with no way to join to the original resource.

**Recommendation:** Acceptable for an audit log (you want to keep records even after deletion), but add a `target_snapshot jsonb` column to capture content at report/action time. Useful for appeals.

### 1.5 `user_specialties` and `user_specialty_weights` are redundant

Two tables for user–specialty affinity. `user_specialties` is explicit/manual interest. `user_specialty_weights` is a computed score. They model the same concept with different precision. Feed queries will need to join both.

**Recommendation:** Merge into one table. Add a `source` column (`onboarding | manual | inferred`) and a `weight` column. The explicit entries are `weight = 1.0, source = manual`. Computed entries update `weight` in-place.

### 1.6 `conversation_type = 'group_dm'` exists but is unimplemented

The enum is defined, the RLS exists, but `manage-group-membership` and `get-or-create-conversation` only handle `direct`. Group DM will need participant management, leave semantics, and a different `find_conversation` query.

**Recommendation:** Either implement or drop from the enum to avoid confusion. Partial implementations in enums are tech debt.

### 1.7 `system_settings` is now readable by all authenticated users

`20260618000001` adds `system_settings_read` policy: `using (true)`. Keys like `communication.rate_limits` and `feed.discovery_min_quality_score` are internal config — exposing raw values to clients leaks implementation details.

**Recommendation:** Split into `public_settings` (brand config, locale defaults) visible to clients and keep `system_settings` staff-only. Or scope the select policy to a whitelist of safe keys.

---

## 2. Edge Functions

### 2.1 No idempotency on write functions (except `create-post`)

`create-comment`, `toggle-reaction`, `toggle-follow`, `toggle-block`, `send-message` have no idempotency keys. Network retries from clients can produce duplicate comments, duplicate messages, or inconsistent follow state.

**Recommendation:** For destructive/non-idempotent-by-nature writes (`create-comment`, `send-message`), accept an `idempotencyKey` from the caller and check `content_pipeline_runs` or a dedicated idempotency table before inserting.

### 2.2 `manage-group-membership` mixes actor roles in one function

`join`/`leave`/`request` are user self-service actions. `approve`/`reject`/`ban` are admin actions. Same function, same endpoint, different permission models. The admin path checks `actorMember.role` but the user path doesn't verify profile ownership (open security issue #1 in report.md).

**Recommendation:** Split into two functions: `group-self-membership` (join/leave/request) and `group-admin-membership` (approve/reject/ban). Cleaner permission model, easier to test.

### 2.3 `invokeEmitNotification` is double fire-and-forget

`_shared/notifications.ts` calls `emit-notification` as fire-and-forget with `.catch(warn)`. `emit-notification` then calls `communication-dispatch` as fire-and-forget. Two async hops, both swallowing errors. A notification failure is completely invisible.

**Recommendation:** Log a structured entry to `content_pipeline_runs` (or a dedicated `notification_audit` table) when notification dispatch fails, so failures are queryable. Don't need to block the caller — just make failures observable.

### 2.4 Missing edge functions for defined schema features

These DB constructs exist with no corresponding function:

| Feature | Schema exists | Function missing |
|---------|--------------|-----------------|
| Create page | `pages`, `pages_insert` RLS | No `create-page` |
| Edit post | `posts.edited_at` column | No `edit-post` |
| Mention notification | `parseMentionSlugs()` in `notifications.ts` | Not called in `create-post` / `create-comment` |
| Schedule post | `posts.scheduled_at`, `post_lifecycle.scheduled` | No scheduler |
| Group invite | `group_join_policy = 'invite_only'` | Blocked with `403`, no invite mechanism |
| Group DM | `conversation_type = 'group_dm'` | Not implemented |

**Recommendation:** Either implement or document as Faz 2+ scope. Dead schema features create confusion for API implementors.

### 2.5 No structured DB constraint error mapping

When Postgres raises a constraint violation (unique slug, FK violation, check constraint), edge functions return the raw `error.message` string from PostgREST. Clients get implementation details (`duplicate key value violates unique constraint "profiles_slug_key"`).

**Recommendation:** Add a `mapDbError(error)` helper in `_shared/response.ts` that maps common Postgres error codes (`23505` = unique, `23503` = FK, `23514` = check) to clean snake_case error codes.

---

## 3. RLS

### 3.1 `posts_select` calls `can_view_post()` per row

Already deferred in report.md. Worth quantifying: a feed query scanning 500 posts (before filtering) fires `can_view_post` 500 times. Each call joins `follows`, `group_members`, `page_members`, and `blocks`. At 100 concurrent feed requests, this is 50,000 sub-queries per second.

**Recommendation (Faz 2):** The Cloudflare Worker API layer should compose explicit visibility filters before sending queries to PostgREST. Pass `?visibility=eq.public&group_id=is.null` (or appropriate filter set) so PostgREST can use indexes and skip the per-row function entirely. Reserve `can_view_post()` for single-post permission checks only.

### 3.2 No hard-delete path (GDPR compliance gap)

Every table uses soft-delete (`deleted_at`) or has no delete RLS at all. When a user requests data deletion (GDPR Art. 17), there's no mechanism to permanently erase their data. `auth.users` cascade-deletes profiles, but content (`posts`, `comments`, `reactions`, `messages`) remains.

**Recommendation:** Design a `delete-account` edge function that:
1. Soft-deletes the profile immediately (blocks new activity).
2. Enqueues a `content_pipeline_runs` job for hard deletion after a 30-day retention window.
3. Anonymizes rather than hard-deletes content that is part of a public discussion thread (replaces author with `[deleted]` profile).

### 3.3 No `delete` RLS on messaging tables

`messages`, `conversations`, `conversation_participants` have no `delete` RLS. Users can soft-delete their own messages (via `delete-message` edge function using `deleted_at`), but can't actually leave a conversation (delete their `conversation_participants` row) except through `mark-conversation-read`. This leaves zombie participants.

**Recommendation:** Add `conversation_participants_delete` policy scoped to own profile. Complement with a `leave-conversation` edge function.

---

## 4. Communication System

### 4.1 `communication-dispatch` has no lock timeout / auto-unlock

`claim_pending_notification_deliveries()` sets `locked_at` on claimed rows. If the function crashes mid-batch (Deno timeout, OOM), those rows stay locked indefinitely. There's no `locked_at < now() - interval '5 minutes'` recovery clause in the claim query.

**Recommendation:**
```sql
and (nd.locked_at is null or nd.locked_at < now() - interval '10 minutes')
```
Add this to the `WHERE` clause in `claim_pending_notification_deliveries`. Stale locks auto-expire.

### 4.2 Push channel sends to all devices sequentially

For a user with multiple registered devices, `push.ts` sends FCM calls one-by-one in a loop. FCM supports multicast (up to 500 tokens per request) via `sendEachForMulticast`.

**Recommendation:** Batch all device tokens for the same user into a single FCM multicast call. Also: the APNS path (iOS) needs a separate token handling strategy — FCM v1 handles both Android and APNs.

### 4.3 Email channel calls `auth.admin.getUserById()` per delivery

This is a GoTrue admin API call, subject to Supabase admin rate limits (~100 req/s on free tier). High notification volume will hit this limit.

**Recommendation:** Store user email in `user_settings.preferences` at signup (via `handle_new_user` trigger or a profile completion step). Then the email lookup is a simple DB query instead of an admin API call.

### 4.4 MQS trigger fires on each evidence change

`trg_post_evidences_quality` fires `compute_post_quality_score()` after every single `INSERT/UPDATE/DELETE` on `post_evidences`. If `create-post` inserts 5 evidences, this fires 5 times, recomputing the full score each time.

**Recommendation:** Use a `DEFERRABLE INITIALLY DEFERRED` trigger (like `validate_post_specialties`). One computation per transaction regardless of how many evidences are inserted.

---

## 5. Feed System

### 5.1 Feed scoring has no time decay

`quality_score` (MQS, 0–100) is static — it's set once and never changes. A 6-month-old high-quality post scores the same as a fresh one. The feed will surface old content indefinitely.

**Recommendation:** Add a `feed_score` computed column (or view) that combines MQS with a time decay function:
```sql
quality_score * exp(-0.1 * extract(epoch from (now() - published_at)) / 86400)
```
Update `feed_score` on a daily cron (or compute at query time for simplicity first).

### 5.2 `feed_impressions` has no deduplication

The table has no unique constraint on `(profile_id, post_id, event_type)`. Multiple `impression` events for the same post/profile are silently duplicated. Feed algorithms trained on this data will overweight seen posts.

**Recommendation:** For `impression` and `click` events, use `ON CONFLICT DO NOTHING` with a partial unique index. For `dwell` (can accumulate), allow multiples.

### 5.3 No feed query entry point

The feed schema (specialties, quality scores, impressions) is fully built, but there's no `get-feed` edge function or RPC that actually runs a feed query. Faz 2 API layer will need to implement feed assembly — document the expected query contract now so the schema and API designs stay aligned.

**Recommendation:** Write a `private.get_feed_posts(p_profile_id uuid, p_limit int, p_offset int)` SQL function that encapsulates the specialty+quality+seen filter logic. Keeps feed query logic in one place, testable independently.

---

## 6. Operational / Observability

### 6.1 No health check endpoint

None of the 23 functions expose a `GET /` or `/health` response. The Faz 2 API worker will need to probe Supabase functions for readiness.

**Recommendation:** Add `supabase/functions/health/index.ts` returning `{ status: "ok", ts: Date.now() }`. Simple, costs nothing.

### 6.2 `system_settings` has no cache

Every function that reads `system_settings` (communication channel config, feed quality threshold) makes a live DB query. This is called in the critical path of `communication-dispatch` (one call per delivery to check `enabled_channels`).

**Recommendation:** Cache `system_settings` in-memory with a 60-second TTL inside the edge function module scope (Deno module-level variable). Edge function instances are reused per-worker — this is safe and effective.

### 6.3 No structured audit trail for admin actions

`moderation_actions` captures moderation but has no admin login audit (who reviewed what professional application, who changed system settings). `review-professional-application` writes `reviewed_by`, which is good, but other admin operations have no equivalent.

**Recommendation:** Add `actor_user_id timestamptz` to `system_settings` (already has `updated_by`) and ensure all staff-facing functions log to `moderation_actions` or a dedicated `admin_audit_log` table.

---

## 7. Missing Hardening Before Production

| Area | Gap | Severity |
|------|-----|----------|
| Profile ownership in `manage-group-membership` | Anyone can join/leave as any profile | 🔴 |
| UUID validation in `toggle-follow` / `toggle-block` | PostgREST filter injection | 🔴 |
| `moderate-target` profile ban no-op | Ban does nothing to the profile | 🟠 |
| `conversations.updated_at` silent fail | Sort order always wrong | 🟠 |
| Duplicate conversation race | Concurrent `get-or-create` creates duplicates | 🟠 |
| Lock timeout in `communication-dispatch` | Stuck deliveries after crash | 🟠 |
| GDPR hard-delete path | No account deletion mechanism | 🟠 |
| Mention detection in posts/comments | `parseMentionSlugs` exists but not called | 🟡 |
| `feed_impressions` deduplication | Training data quality | 🟡 |
| Feed time decay | Old content resurfaces indefinitely | 🟡 |

---

## Priority Order for Faz 2 Prep

1. Fix open security issues from `report.md` (profile ownership, UUID injection).
2. Add lock timeout to `claim_pending_notification_deliveries`.
3. Migrate message attachments to use `media` table (fixes storage read logic too).
4. Design and implement `get-feed` RPC — this is the most complex missing piece for the API layer.
5. Add `feed_score` time decay column (simple, high value).
6. Scope `system_settings` read access.
7. Wire mention detection in `create-post` / `create-comment`.
8. Implement `create-page` and `edit-post` functions before API scaffolding.

---

## 8. API Auth Plan Critique (`api_auth_geliştirme_bc1c6927.plan.md`)

### 8.1 `user_auth_sessions` table creates dual source of truth

Plan marks this table "opsiyonel" but includes it in PR-2 scope. **Problem:** GoTrue's `auth.sessions` is authoritative. When a session is revoked via admin panel, password reset, or GoTrue internals, `user_auth_sessions` row stays — no cascade. Listing `/auth/sessions` from `user_auth_sessions` will show stale sessions; listing from GoTrue admin API is accurate but slow (see 8.3).

**Recommendation:** Drop `user_auth_sessions`. Store only device display metadata in `user_devices` (already exists), keyed on `gotrue_session_id`. On session revoke, clean up via `gotrue_session_id`. Single source of truth: GoTrue.

### 8.2 `otp/send` with `createUser: false` is a user enumeration vector

Plan says: return `user_not_found` 404 when `createUser: false` and email doesn't exist. This confirms whether an email is registered — classic account enumeration. GoTrue's own `/auth/v1/otp` intentionally returns `200` regardless of whether the user exists.

**Recommendation:** Always return `200 { message: "If this email is registered, a code was sent" }` from `POST /auth/otp/send`. Never confirm or deny user existence. Move `createUser` logic to verify step: if verify succeeds on a new user and `createUser` was in the original token/state, create the account; otherwise reject with `user_not_found` only at verify time (less enumerable, OTP proves email ownership).

### 8.3 GoTrue admin API rate limits — session management will hit them

`GET /auth/sessions` and `DELETE /auth/sessions/:id` both call GoTrue admin API (`listUserSessions`, `deleteUserSession`). As documented in §4.3 of this report, GoTrue admin API is rate-limited (~100 req/s on free tier). Session list is opened every time a user visits account settings. 1000 concurrent users = instant throttle.

**Recommendation:** Cache `listUserSessions` result in Cloudflare KV with a 30-second TTL, keyed on `user_id`. Invalidate on `DELETE /sessions/:id` and `logout`. Writes (revoke) still go through admin API directly — only reads are cached.

### 8.4 OAuth PKCE verifier storage unspecified — broken on Cloudflare Workers

Plan mentions `state/PKCE` in `lib/oauth.ts` but doesn't specify where the PKCE `code_verifier` is stored between `/oauth/{provider}` (authorize) and `/auth/callback`. **Cloudflare Workers are stateless** — in-memory storage doesn't survive across requests, and two requests can land on different isolates. If `code_verifier` is in-memory, the callback will fail ~50% of the time in production.

**Recommendation:** Store PKCE `code_verifier` + `state` in a signed short-lived cookie (SameSite=Lax, HttpOnly, 10-minute expiry) set on the authorize redirect. Read and clear it on callback. No KV needed, works across isolates.

### 8.5 Max sessions policy evicts oldest, not least-recently-used

Plan: "aşılırsa en eski iptal" (oldest session is revoked when limit exceeded). A user with a permanent desktop session (6 months old, used daily) will be evicted when they add a new phone — even though the desktop is more active.

**Recommendation:** Evict by `last_used_at ASC` (least recently used), not `created_at ASC`. GoTrue's session list includes last-active timestamps — sort by that before eviction.

### 8.6 `revoke-others` endpoint duplicates `logout?scope=others`

Plan defines both `POST /auth/sessions/revoke-others` (separate endpoint) and `POST /auth/logout { scope: "others" }`. Both do the same thing: revoke all sessions except current. Two endpoints for one operation is API surface bloat.

**Recommendation:** Remove `POST /auth/sessions/revoke-others`. Extend `POST /auth/logout` to accept `scope: "local" | "others" | "global"`. Existing GoTrue proxy already supports the `scope` parameter — no extra work.

### 8.7 `last_seen_at` middleware update adds write to every request's critical path

Plan: "Middleware'de `last_seen_at` throttle güncelleme (opsiyonel Faz D)". Even throttled (e.g., once per 5 minutes), this is a Postgres write on every request that hits the throttle boundary. At 10k req/min, that's potentially hundreds of concurrent writes to `user_auth_sessions` (or `user_devices`).

**Recommendation:** Fire-and-forget to a Cloudflare Queue or use `waitUntil()` (non-blocking). The update must never be on the synchronous path. Alternatively, skip `last_seen_at` on `user_auth_sessions` entirely — GoTrue tracks this natively.

### 8.8 `PATCH /v1/auth/email` OTP flow is underspecified

Faz D defers email change but says "OTP ile doğrulama" without specifying the flow. GoTrue's built-in email change sends a magic link (not OTP) to the new address and requires re-auth. Overriding this to use OTP requires: (1) sending OTP to new address, (2) holding the pending new email in state until verified, (3) calling GoTrue admin `updateUser` after verification. None of this is in the plan.

**Recommendation:** Before implementing: decide whether to use GoTrue's built-in email change flow (simpler, but magic link, not OTP) or build a custom OTP-based flow (consistent UX, but requires `pending_email` state storage). If custom: store `{ pending_email, otp_code_hash, expires_at }` in a short-lived Postgres row or KV entry; verify OTP, then call GoTrue admin API to update.

### 8.9 No token binding — refresh token theft undetectable

Plan stores `deviceName` and `platform` as display strings from the client. These are user-supplied and unverified. Refresh tokens are not bound to any device fingerprint. A stolen refresh token can be used from any IP/device with no detection.

For Faz E hardening, consider:
- Refresh token rotation (GoTrue supports this — enable `GOTRUE_SECURITY_REFRESH_TOKEN_ROTATION_ENABLED`)
- Suspicious refresh detection: if refresh comes from a new country/IP after token rotation, flag and notify
- This doesn't require device fingerprinting — token rotation alone catches replay attacks

### 8.10 OTP rate limiting — API layer vs GoTrue double-limiting

Plan: IP + email rate limit in `rate-limit.ts`. GoTrue also has built-in OTP rate limits (configurable in Dashboard). Two independent rate limiters with different limits and error formats produce inconsistent behavior: one returns `429` with `rate_limited` code, GoTrue returns `429` with its own body. Clients must handle both.

**Recommendation:** Pick one. Preferred: rely on GoTrue's built-in OTP rate limiting (it's per-email, accurate, no state needed in Workers). In `rate-limit.ts`, only apply IP-level limits (not per-email) to guard against bulk enumeration. Pass GoTrue's `429` through to the client as-is with error code `rate_limited`.
