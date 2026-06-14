# professional_applications

## Amaç

Normal **user** hesabının **professional** hesaba yükseltilmesi için admin onay sürecini yönetir.

## İlişkiler

- `user_id` → `auth.users`
- `profile_id` → `profiles` — başvuruyu yapan mevcut user profili
- `reviewed_by` → `auth.users` — onaylayan staff

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Başvuru ID |
| `user_id` | uuid | Başvuran kullanıcı |
| `profile_id` | uuid | İlgili profil |
| `status` | application_status | `pending`, `approved`, `rejected` |
| `notes` | text | Admin notları |
| `submitted_at` | timestamptz | Başvuru zamanı |
| `reviewed_at` | timestamptz | Karar zamanı |
| `reviewed_by` | uuid | Karar veren staff |

## Akış

1. Kullanıcı başvuru oluşturur (`status = pending`)
2. Staff inceler → onayda `profiles.account_kind = professional` güncellenir (uygulama katmanı)
3. Bildirim: `professional_application` event type

## RLS

- SELECT/INSERT: yalnızca kendi `user_id`
- UPDATE: client yok (staff/service role)

## Notlar

- `system_settings.professional.application_auto_reject_days` ile otomatik red (gelecek job)
