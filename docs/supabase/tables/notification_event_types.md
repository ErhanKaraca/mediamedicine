# notification_event_types

## Amaç

Bildirim **olay kataloğu** — hangi event'lerin hangi varsayılan kanallarda gideceğini tanımlar.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `code` | text PK | Olay kodu (like, comment, follow, …) |
| `category` | text | social, system, marketing |
| `default_channels` | jsonb | Varsayılan kanal dizisi |
| `user_configurable` | boolean | Kullanıcı kapatabilir mi |
| `description` | text | İnsan okunur açıklama |

## Seed olaylar

| code | Varsayılan kanallar |
|------|---------------------|
| like, comment, follow, repost, mention | in_app, push |
| group_join_request | in_app |
| group_join_approved | in_app, push |
| message | in_app, push, email |
| moderation_action, professional_application | in_app, email |

## RLS

- SELECT: authenticated
- Yazma: service role (admin)

## İlgili

- [user_notification_settings.md](./user_notification_settings.md)
- [notifications.md](./notifications.md)
