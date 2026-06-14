# moderation_actions

## Amaç

Staff tarafından uygulanan **moderasyon eylemlerinin** audit log'u.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Eylem ID |
| `moderator_user_id` | uuid | Moderator auth user (profil ID değil; personelin `profiles` kaydı ayrıca olabilir) |
| `target_type` | text | post, comment, profile, user, group, … |
| `target_id` | uuid | Hedef |
| `action` | text | hide, remove, warn, ban, restore |
| `reason` | text | Gerekçe |
| `metadata` | jsonb | Ek bağlam |
| `created_at` | timestamptz | Zaman |

## RLS

RLS açık, **client policy yok** — yalnızca staff/service role

## İlişki

Şikayet çözümü `reports` tablosu ile birlikte yönetilir; post/yorum `moderation_state` güncellenir

## Notlar

- Immutable audit — güncelleme/silme yok (tasarım tercihi)
