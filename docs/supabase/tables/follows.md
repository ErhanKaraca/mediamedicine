# follows

## Amaç

Profil **takip** ilişkisi. Yalnızca `professional` ve `page` profilleri takip **edilebilir**; user profilleri ve gruplar takip edilemez.

## İlişkiler

- `follower_profile_id` → takip eden profil
- `following_profile_id` → takip edilen profil

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `follower_profile_id` | uuid PK (composite) | Takipçi |
| `following_profile_id` | uuid PK (composite) | Takip edilen |
| `created_at` | timestamptz | Takip başlangıcı |

## Kısıtlar

- Kendini takip edemez (`follows_no_self`)
- `validate_follow_target` trigger: hedef kind professional veya page olmalı

## Trigger

`follows_count_trg` — `profiles.follower_count` / `following_count` günceller

## RLS

- SELECT: herkes
- INSERT/DELETE: follower profilin sahibi kullanıcı

## Kullanım

- `post_visibility = followers` kontrolünde `can_view_post` bu tabloya bakar
- Bildirim: `follow` event type
