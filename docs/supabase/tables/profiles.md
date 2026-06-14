# profiles

## Amaç

Platformdaki tüm **public sosyal kimlik kabuğu**. User, professional ve page hesapları bu tabloda temsil edilir. **Gruplar burada değildir** — gruplar `groups` tablosundadır.

**Platform staff** burada ayrı bir tür değildir. Personel de kayıt olduğunda (staff atamasından bağımsız) bu tabloda `user` profili alır; staff yetkisi `platform_staff` tablosunda tutulur.

## URL eşlemesi

| account_kind | URL |
|--------------|-----|
| `user`, `professional` | `user/{slug}` |
| `page` | `mm/{slug}` |

## İlişkiler

- `owner_user_id` → `auth.users` — user/professional için sahip; page için **null**
- Referans alan tablolar: `posts`, `follows`, `page_members`, `group_members`, `media`, …

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Profil kimliği |
| `owner_user_id` | uuid | Sahip kullanıcı (page hariç zorunlu mantıksal) |
| `account_kind` | account_kind | `user`, `professional`, `page` |
| `slug` | citext unique | URL parçası, 3–40 karakter, `[a-zA-Z0-9_-]` |
| `display_name` | text | Görünen ad |
| `bio` | text | Biyografi (max 500 karakter) |
| `avatar_url` | text | Avatar URL (Storage veya harici) |
| `banner_url` | text | Kapak görseli |
| `visibility_settings` | jsonb | Profil düzeyi gizlilik ayarları |
| `follower_count` | int | Takipçi sayısı (denormalize, trigger) |
| `following_count` | int | Takip edilen sayısı |
| `post_count` | int | Yayınlanmış post sayısı |
| `is_verified` | boolean | Onay rozeti |
| `created_at`, `updated_at` | timestamptz | Zaman damgaları |
| `deleted_at` | timestamptz | Soft delete |

## Trigger'lar

- `trg_profiles_updated_at` — `updated_at` güncelleme
- `on_auth_user_created` → `handle_new_user()` — kayıtta otomatik user profili (staff dahil tüm auth kullanıcıları)

## İş kuralları

- **User:** duvar yok, yalnızca gruplara post
- **Professional:** duvar var, takip edilebilir, evidence zorunlu
- **Page:** `pages` ile 1:1, `owner_user_id` null olmalı

## RLS

- SELECT: silinmemiş profiller herkese
- INSERT: authenticated, kendi `owner_user_id`, kind user/professional
- UPDATE: sahip veya `can_post_as` yetkisi

## İlgili dokümanlar

- [architecture.md](../architecture.md)
- [platform_staff.md](./platform_staff.md)
- [pages.md](./pages.md)
- [posts.md](./posts.md)
