# notifications

## Amaç

Kullanıcıya giden **in-app bildirim** kayıtları. Her olay bir satır; kanal teslimatı `notification_deliveries`'de ayrı takip edilir.

## İlişkiler

- `recipient_user_id` → alıcı auth user
- `recipient_profile_id` → hangi profil bağlamında (opsiyonel)
- `actor_profile_id` → eylemi yapan profil
- `event_type` → `notification_event_types.code`

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Bildirim ID |
| `recipient_user_id` | uuid | Alıcı kullanıcı |
| `recipient_profile_id` | uuid | Profil bağlamı |
| `actor_profile_id` | uuid | Aktör profil |
| `event_type` | text | Olay türü |
| `entity_type` | text | post, comment, profile, … |
| `entity_id` | uuid | İlgili entity |
| `title` | text | Bildirim başlığı |
| `body` | text | Kısa metin |
| `payload` | jsonb | Derin link, ek veri |
| `read_at` | timestamptz | Okundu zamanı (null = okunmadı) |
| `created_at` | timestamptz | Oluşturma |

## RLS

- SELECT/UPDATE: `recipient_user_id = auth.uid()`

## Edge Function

[emit-notification](../edge-functions/emit-notification.md)

## Gelecek

Communication edge-function pending delivery'leri tüketir (push, email, sms, …)
