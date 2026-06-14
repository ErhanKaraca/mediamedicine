# posts

## Amaç

Platformun ana **içerik birimi**. Lexical JSON gövde, yerleşim (grup/duvar/sayfa bağlamı), visibility, moderasyon ve işleme durumu tek satırda tutulur.

## İlişkiler

- `author_profile_id` → kim adına
- `actor_user_id` → hangi auth user tetikledi
- `group_id` → grup postu (user için zorunlu)
- `page_context_id` → başka sayfa duvarı
- `quote_of_id` → alıntılanan post
- `primary_media_id` → `media`

## Kolonlar — kimlik ve yerleşim

| Kolon | Açıklama |
|-------|----------|
| `id` | UUID primary key |
| `author_profile_id` | Yazar profili |
| `actor_user_id` | İşlemi yapan kullanıcı |
| `group_id` | Grup (user postları için zorunlu) |
| `page_context_id` | Sayfa duvarı bağlamı |

## Kolonlar — içerik

| Kolon | Açıklama |
|-------|----------|
| `content` | Lexical editor JSON |
| `content_plain` | Düz metin özeti, max 2000 karakter, FTS |
| `post_type` | standard, quote, repost |
| `content_type` | case_study, guideline_update, discussion, … (içerik türü) |
| `quality_score` | MedicalQualityScore 0–100 |
| `quote_of_id` | Quote/repost hedefi |

## Kolonlar — görünürlük ve etkileşim

| Kolon | Açıklama |
|-------|----------|
| `visibility` | post_visibility enum |
| `reply_policy` | Kim yorum yazabilir |
| `allow_comments`, `allow_reactions`, `allow_reposts` | Feature flag'ler |

## Kolonlar — durum

| Kolon | Açıklama |
|-------|----------|
| `status` | post_lifecycle |
| `moderation_state` | Moderasyon durumu |
| `processing_state` | Medya/pipeline durumu |
| `scheduled_at`, `published_at` | Zamanlama |
| `deleted_at` | Soft delete |

## Kolonlar — sayaçlar

| Kolon | Açıklama |
|-------|----------|
| `reaction_count`, `comment_count`, `repost_count`, `view_count` | Denormalize |
| `is_pinned`, `is_sensitive` | UI bayrakları |
| `metadata` | Genişletilebilir JSON |

## Trigger'lar

- `validate_post_placement` — yerleşim kuralları
- `posts_count_trg` — profil/grup post sayacı
- `trg_posts_updated_at`

## RLS

- SELECT: published + moderation none + `can_view_post`
- INSERT: actor = auth.uid + `can_post_as`
- UPDATE: actor veya can_post_as

## Edge Function

[create-post](../edge-functions/create-post.md)

## İlgili

- [post_evidences.md](./post_evidences.md)
- [post_specialties.md](./post_specialties.md)
- [post_media.md](./post_media.md)
- [architecture.md](../architecture.md)
