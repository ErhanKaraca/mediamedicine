# reports

## Amaç

Kullanıcı **şikayet** kayıtları — post, yorum, profil veya mesaj hedefli.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Şikayet ID |
| `reporter_profile_id` | uuid | Şikayet eden profil |
| `target_type` | text | post, comment, profile, message |
| `target_id` | uuid | Hedef entity ID |
| `reason_code` | text | Şikayet kodu (spam, harassment, …) |
| `details` | text | Serbest açıklama |
| `status` | text | open, reviewing, resolved, dismissed |
| `created_at` | timestamptz | Oluşturma |
| `resolved_at` | timestamptz | Çözüm zamanı |
| `resolved_by` | uuid | Çözen staff user |

## RLS

- INSERT/SELECT: reporter profilin sahibi

## Edge Function

[submit-report](../edge-functions/submit-report.md)

## İş akışı

1. Kullanıcı şikayet açar (`open`)
2. Staff inceler → `moderation_actions` + status güncelleme
3. Bildirim: `moderation_action` (gelecek)
