# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Supabase-backed social media platform for medical professionals. Currently **Faz 1** (Supabase foundation). Planned stack:
- **Faz 1 (active)**: Supabase — Postgres + RLS + Auth + Storage + Edge Functions (Deno 2)
- **Faz 2 (active)**: `apps/api` — Cloudflare Worker (Hono) with Durable Objects, rate limiting, idempotency
- **Faz 3**: `apps/web` — Next.js + TanStack Query + Tailwind
- **Faz 4**: `apps/mobile` — Flutter + Riverpod (Dart client generated from OpenAPI)

Scale target: 2M users, ~65k posts/day. Low write rate; read/feed is the dominant load.

## Local Development (Faz 1)

Prerequisites: Supabase CLI + Docker.

```bash
supabase start          # Start local stack (Postgres :54322, API :54321, Studio :54323)
supabase db reset       # Apply all migrations + seed from scratch
supabase stop

# Add a new migration
supabase migration new <descriptive_name>
# Edit the generated SQL, then:
supabase db reset

# Run a single Edge Function locally
supabase functions serve <function-name> --no-verify-jwt
```

Node version: 22 (`.nvmrc`). JS workspace uses pnpm + Turborepo.

## Local Development (Faz 2 — API)

```bash
pnpm install
pnpm --filter @mediamedicine/shared build
cp apps/api/.dev.vars.example apps/api/.dev.vars   # fill from supabase status
pnpm --filter @mediamedicine/api dev               # http://127.0.0.1:8787
pnpm --filter @mediamedicine/api test
pnpm --filter @mediamedicine/api openapi:export
```

API docs: [`docs/api/README.md`](docs/api/README.md)

## Architecture

### Database (migrations run in filename order)

| File | Contents |
|------|----------|
| `*_extensions_private.sql` | `private` schema, `citext` extension, `set_updated_at()` trigger helper, `current_user_id()` |
| `*_core_identity.sql` | `profiles`, `platform_staff`, `professional_applications`, `user_settings`, `system_settings` |
| `*_entities.sql` | `pages`, `groups`, `group_members`, `page_members` |
| `*_social_graph.sql` | `follows`, `blocks` |
| `*_posts_content.sql` | `posts`, `post_evidences`, `media`, `post_media`, `link_previews`, `content_pipeline_runs` |
| `*_engagement.sql` | `comments`, `reactions` |
| `*_notifications.sql` | `notifications`, `notification_event_types`, `user_notification_settings`, `notification_deliveries`, `user_devices` |
| `*_moderation_feed.sql` | `reports`, `moderation_actions`, `feed_seen_items` |
| `*_rls.sql` | All RLS policies (enabled on every public table) |
| `*_storage.sql` | Storage bucket policies |
| `*_feed_*.sql` | Feed specialties, quality/impressions tables, feed-specific RLS + triggers |

Key schema conventions:
- All tables use `uuid` PKs (`gen_random_uuid()`).
- Soft-delete via `deleted_at timestamptz` on `profiles` and `posts`.
- `private.set_updated_at()` trigger on every table with `updated_at`.
- `private.current_user_id()` wraps `auth.uid()` — used in RLS policies.
- `private.can_post_as(profile_id, user_id)` — used for page/group posting permission checks in RLS.
- `citext` for case-insensitive unique slugs (in `extensions` schema).
- Counter columns (`follower_count`, `post_count`, etc.) are maintained by triggers, not application code.

### Edge Functions (`supabase/functions/`)

Each function is a `Deno.serve()` handler. Shared utilities in `_shared/`:

| Module | Purpose |
|--------|---------|
| `auth.ts` | `createUserClient(authHeader)` / `createAdminClient()` — always use these, never construct clients inline |
| `response.ts` | `json(data, init)` / `errorResponse(code, message, status, extra)` — all responses go through these |
| `config.ts` | Shared limits and constants (`POST_BODY_MAX_CHARS`, `POST_MEDIA`, `POST_ATTACHMENTS`, `STORAGE_BUCKETS`, `NOTIFICATION_CHANNELS`) |
| `log.ts` | `createLogger({fn})` — structured JSON logger; one JSON object per line for Supabase log drains |
| `cors.ts` | `corsHeaders`, `handlePreflight(req)` |
| `feed.ts` / `quality.ts` | Feed ranking and content quality helpers |

Function pattern:
```ts
Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return errorResponse("method_not_allowed", "POST only", 405);
  // auth, validate, act, return json(...)
});
```

`config.toml` controls `verify_jwt` per function. `link-preview`, `emit-notification`, and `content-pipeline-collect` run without JWT verification (called by internal services).

### Storage Buckets

| Bucket | Public | Limits |
|--------|--------|--------|
| `avatars` | ✓ | 5 MiB, png/jpeg/webp |
| `post-media` | ✗ | 50 MiB, images + mp4 |
| `post-attachments` | ✗ | 5 MiB, PDF/Office/CSV |

Storage paths follow: `{owner_profile_id}/{media_id}.{ext}`

## Conventions

- Error codes are snake_case strings (e.g. `"unauthorized"`, `"image_too_large"`). Never use HTTP status text as `code`.
- All writes to `media` table go through `media-upload-init` → client uploads to signed URL → `media-finalize`. Never insert `media` rows with `status: 'ready'` directly.
- `account_kind` enum: `user | professional | page`. Pages have no `owner_user_id` (enforced by constraint). Groups are a separate table.
- `platform_staff` is orthogonal to `account_kind` — staff users get a normal profile on signup; operational permissions live in `platform_staff`.
- RLS always enforces `deleted_at is null` on selects for soft-deleted rows.
