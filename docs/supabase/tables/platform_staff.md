# platform_staff

## Amaç

Platform içi personelin **operasyonel yetkisini** temsil eder: süper admin, moderatör, destek ve içerik operasyonları.

Bu tablo sosyal kimlik değildir. `profiles` tablosundaki `user` / `professional` / `page` türlerinden bağımsızdır; aynı `auth.users` kaydında ikisi birlikte bulunabilir.

## Personel atama akışı

1. Kişi normal kayıt olur → `handle_new_user` otomatik `profiles` (`account_kind = 'user'`) ve `user_settings` oluşturur.
2. Admin (service role) aynı `user_id` için `platform_staff` satırı ekler → moderasyon / destek yetkisi gelir.
3. İsteğe bağlı: kişi `professional_applications` ile professional hesaba yükseltilebilir; staff yetkisi ayrı kalır.

Moderatörler tipik olarak **user profili** ile gruplara post atar, mesajlaşır; moderasyon işlemleri staff paneli / edge function'lar üzerinden yapılır.

## İlişkiler

- `user_id` → `auth.users(id)` — Supabase Auth hesabı (PK)
- Aynı `user_id` için `profiles.owner_user_id` ile sosyal profil eşleşebilir (zorunlu değil, pratikte kayıtta oluşur)

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `user_id` | uuid PK | Personelin auth kullanıcı ID'si |
| `role` | text | `super_admin`, `moderator`, `support`, `content_ops` |
| `permissions` | text[] | İnce taneli izin listesi (ör. `moderate_posts`) |
| `status` | text | `active` veya `suspended` |
| `created_at` | timestamptz | Kayıt zamanı |

## RLS

RLS açık. Client tarafında yalnızca **self SELECT** (`platform_staff_self_select`) vardır. INSERT / UPDATE / DELETE yalnızca service role ile yapılır.

## Kullanım

- `private.is_platform_staff(user_id, permission?)` — yetki kontrolü
- Edge: `assertPlatformStaff()` (`_shared/staff.ts`) — `moderate-target`, `review-professional-application` vb.
- Moderasyon audit: `moderation_actions.moderator_user_id` (profil ID değil, auth user)

## Notlar

- Staff için ayrı `account_kind` veya duvar **yoktur**; sosyal davranış bağlı olduğu `profiles` satırının türüne göre belirlenir.
- `permissions` boş dizi olabilir; `moderator`, `content_ops`, `support` rolleri closure migration ile temel staff erişimi alır.
- Moderasyon eylemlerinin kullanıcıya “platform adına” mı yoksa kişisel profil adına mı gösterileceği ürün/UI kararıdır; şema `moderator_user_id` ile audit tutar.

## İlgili dokümanlar

- [architecture.md](../architecture.md)
- [profiles.md](./profiles.md)
- [moderation_actions.md](./moderation_actions.md)
