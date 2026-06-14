# user_devices

## Amaç

Push bildirimi için **cihaz token** kayıtları (iOS, Android, Web Push).

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Kayıt ID |
| `user_id` | uuid | Kullanıcı |
| `platform` | text | ios, android, web |
| `push_token` | text | FCM/APNs/Web push token |
| `enabled` | boolean | Bu cihaza push gönderilsin mi |
| `updated_at` | timestamptz | Token yenileme zamanı |

## Unique

`(user_id, platform, push_token)` — aynı token tekrar kaydedilmez

## RLS

- Tüm işlemler: `user_id = auth.uid()`

## Gelecek

Communication edge-function push gönderiminde bu tabloyu okur
