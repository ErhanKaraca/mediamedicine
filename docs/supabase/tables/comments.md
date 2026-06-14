# comments

## Amaç

Post altı **yorumlar**. Post reply değil — ayrı tablo. Lexical JSON gövde, thread (max 3 derinlik).

## İlişkiler

- `post_id` → `posts`
- `author_profile_id`, `actor_user_id` → post ile aynı actor modeli
- `parent_comment_id` → üst yorum (null = kök)

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Yorum ID |
| `post_id` | uuid | Bağlı post |
| `author_profile_id` | uuid | Yazar profili |
| `actor_user_id` | uuid | İşlemi yapan user |
| `parent_comment_id` | uuid | Üst yorum |
| `thread_depth` | int | 0–3 (trigger hesaplar) |
| `content` | jsonb | Lexical JSON |
| `content_plain` | text | Max 2000 karakter |
| `status` | post_lifecycle | Yayın durumu |
| `moderation_state` | moderation_state | Moderasyon |
| `created_at`, `updated_at`, `deleted_at` | timestamptz | Zaman + soft delete |

## Trigger'lar

- `comments_depth_trg` — derinlik ve max 3 kontrolü
- `comments_count_trg` — `posts.comment_count`

## RLS

- SELECT: silinmemiş + `can_view_post(post_id)`
- INSERT: actor + profil sahibi + görünür post
- UPDATE: actor

## Edge Function

[create-comment](../edge-functions/create-comment.md)
