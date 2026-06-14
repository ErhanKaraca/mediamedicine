# user_settings

## Amaç

Kullanıcı başına **tercih ve yerelleştirme** ayarları.

## İlişkiler

- `user_id` → `auth.users` (PK)

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `user_id` | uuid PK | Kullanıcı |
| `locale` | text | Dil kodu (varsayılan `tr`) |
| `timezone` | text | IANA timezone (varsayılan `Europe/Istanbul`) |
| `preferences` | jsonb | Genişletilebilir tercihler (tema, feed vb.) |
| `updated_at` | timestamptz | Son güncelleme |

## Otomatik oluşturma

`handle_new_user` trigger'ı kayıtta boş satır ekler.

## RLS

- SELECT/UPDATE: yalnızca `user_id = auth.uid()`

## Notlar

- Bildirim kanal tercihleri ayrı tabloda: [user_notification_settings.md](./user_notification_settings.md)
