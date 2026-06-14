# Row Level Security (RLS)

Tüm `public` tablolarında RLS **etkin**. Service role key RLS'i bypass eder (Edge Functions admin işlemleri için).

## Genel prensipler

1. **Okuma:** Çoğu içerik tablosu anon/authenticated SELECT ile erişilebilir; visibility `can_view_post()` ile filtrelenir.
2. **Yazma:** Kullanıcı yalnızca kendi profili / actor_user_id ile ilişkili kayıtları oluşturur.
3. **Staff yönetimi:** `platform_staff` kayıtları client tarafından yazılamaz (service role); personel yalnızca kendi staff satırını okuyabilir. Staff'ın sosyal profili `profiles` RLS kurallarına tabidir.

## Tablo bazlı özet

| Tablo | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Herkes (silinmemiş) | Kendi user/prof | Kendi veya can_post_as | — |
| `user_settings` | Kendi | — | Kendi | — |
| `professional_applications` | Kendi | Kendi (pending) | — | — |
| `pages`, `groups` | Herkes | pages: creator/staff; groups: creator profil | owner/admin üyeler | — |
| `page_members`, `group_members` | Authenticated | page: owner/admin veya staff; group: kendi profil | — | — |
| `follows` | Herkes | Kendi follower profili | — | Kendi follower profili |
| `blocks` | — | Kendi | Kendi | Kendi |
| `posts` | can_view_post + published | can_post_as + actor | actor veya can_post_as | — |
| `post_evidences` | Herkes | Post sahibi actor | — | — |
| `media` | Authenticated | Kendi upload | Kendi upload | — |
| `post_media` | Herkes | — | — | — |
| `comments` | can_view_post | Kendi profil + görünür post | Kendi actor | — |
| `reactions` | Herkes | Kendi profil | — | Kendi profil |
| `notifications` | Kendi recipient | — | Kendi (read_at) | — |
| `user_notification_settings` | Kendi | Kendi | Kendi | Kendi |
| `user_devices` | Kendi | Kendi | Kendi | Kendi |
| `reports` | Kendi reporter | Kendi | — | — |
| `feed_seen_items` | Kendi profil | Kendi | Kendi | Kendi |
| `feed_impressions` | Kendi | Kendi insert | — | — |
| `specialties` | Herkes (active) | — | — | — |
| `post_specialties` | Herkes | Post actor | — | — |
| `user_specialties` | Kendi profil | Kendi | Kendi | Kendi |
| `group_specialties` | Herkes | — | — | — |
| `profile_specialties` | Herkes | — | — | — |
| `user_specialty_weights` | Kendi profil | Kendi | Kendi | Kendi |
| `link_previews` | Herkes | — | — | — |
| `conversations`, `messages`, `conversation_participants` | Katılımcılar | Edge + RLS | Katılımcı (conversations updated_at) | Edge + RLS | — |
| `direct_conversation_pairs` | Katılımcı profil sahibi | — | — | — |
| `notification_deliveries` | Kendi bildirim veya staff | — | — | — |
| `content_pipeline_runs` | Actor veya staff | — | — | — |
| `platform_staff` | Kendi kayıt | — | — | — |
| `system_settings` | Authenticated (read-only) | — | — | — |
| `moderation_actions` | Staff | — | — | — |
| `notification_event_types` | Authenticated | — | — | — |

## Policy olmayan yazma tabloları

Aşağıdaki tablolarda **INSERT/UPDATE/DELETE** yalnızca service role (Edge Functions) ile yapılır; SELECT policy'leri closure migration ile eklendi:

- `moderation_actions` — staff SELECT
- `notification_deliveries` — recipient veya staff SELECT
- `content_pipeline_runs` — actor veya staff SELECT
- `platform_staff` — self SELECT
- `system_settings` — authenticated SELECT (read-only)

## Detay

Tam SQL: `supabase/migrations/20260615000009_rls.sql` + feed/messaging/closure migration'ları (`20260616100003`, `20260617000002`, `20260618000001`)

## Bilinen sınırlamalar

- `can_view_post()` per-row RLS maliyeti — feed sorguları API katmanında filtrelenir
- `search_path` advisor uyarıları — fonksiyonlar `set search_path = ''` ile güncellendi (closure)
