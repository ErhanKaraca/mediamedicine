# reactions

## Amaç

Post **beğeni** (like) kayıtları. v1'de yalnızca `type = 'like'` desteklenir; ileride emoji reaksiyonları genişletilebilir.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `profile_id` | uuid PK (composite) | Reaksiyon veren profil |
| `post_id` | uuid PK (composite) | Hedef post |
| `type` | text | Şimdilik yalnızca `like` |
| `created_at` | timestamptz | Zaman |

## Trigger

`reactions_count_trg` → `posts.reaction_count`

## RLS

- SELECT: herkes
- INSERT/DELETE: profil sahibi + `can_view_post`

## Edge Function

[toggle-reaction](../edge-functions/toggle-reaction.md) — varsa siler, yoksa ekler

## Bildirim

Like sonrası `emit-notification` ile `like` event (API katmanında tetiklenecek)
