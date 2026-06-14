# pages

## Amaç

**Page** profil tipinin kurumsal metadata'sı. Her sayfa tam olarak bir `profiles` satırına (`account_kind = page`) bağlıdır — Facebook sayfası modeli.

## İlişkiler

- `profile_id` → `profiles` (unique, 1:1)
- `created_by_user_id` → sayfayı oluşturan kullanıcı
- `page_members` — sayfa yönetim ekibi

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Sayfa entity ID |
| `profile_id` | uuid unique | Public profil kabuğu |
| `created_by_user_id` | uuid | Oluşturan auth user |
| `visibility` | page_visibility | `public`, `private` |
| `settings` | jsonb | Sayfa özel ayarları |
| `member_count` | int | Üye sayısı (denormalize) |
| `created_at`, `updated_at` | timestamptz | Zaman damgaları |

## Post ilişkisi

- Page **kendi duvarına** `author_profile_id = page.profile_id` ile post atar
- Professional/user, `page_context_id` ile başka sayfa duvarına post atabilir

## RLS

- SELECT: herkes
- INSERT/UPDATE/DELETE: client policy yok (Edge/API)

## İlgili

- [page_members.md](./page_members.md)
- [profiles.md](./profiles.md)
