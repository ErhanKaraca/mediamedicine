# user_notification_settings

## Amaç

Kullanıcının **kanal bazlı bildirim tercihleri**. Event type + kanal kombinasyonunu açıp kapatır.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Satır ID |
| `user_id` | uuid | Kullanıcı |
| `profile_id` | uuid | Profil bağlamı (null = global) |
| `event_type` | text | Olay kodu |
| `channel` | text | in_app, push, email, sms, telegram, slack, whatsapp, realtime |
| `enabled` | boolean | Açık/kapalı |
| `updated_at` | timestamptz | Son değişiklik |

## Unique

`(user_id, profile_id, event_type, channel)`

## Çözümleme sırası

1. Bu tabloda kayıt varsa → `enabled` değeri
2. Yoksa → `notification_event_types.default_channels`
3. Yoksa → `true` (fallback)

Helper: `private.should_notify_channel`

## RLS

- Tüm işlemler: `user_id = auth.uid()`
