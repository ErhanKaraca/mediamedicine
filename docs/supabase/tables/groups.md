# groups

## Amaç

**Bağımsız topluluk entity'si** — profiles'tan tamamen ayrı. Reddit `r/subreddit` mantığı: takip yok, üyelik var.

## İlişkiler

- `created_by_profile_id` → oluşturan profil
- `group_members` — üyelikler
- `posts.group_id` — grup içi postlar

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Grup ID |
| `slug` | citext unique | URL: `g/{slug}`, 3–50 karakter |
| `name` | text | Görünen ad |
| `description` | text | Açıklama |
| `avatar_url`, `banner_url` | text | Görseller |
| `visibility` | group_visibility | public, private, secret |
| `join_policy` | group_join_policy | open, request, invite_only |
| `rules` | jsonb | Topluluk kuralları |
| `settings` | jsonb | Grup ayarları |
| `member_count` | int | Üye sayısı |
| `post_count` | int | Post sayısı |
| `created_by_profile_id` | uuid | Kurucu profil |
| `created_at`, `updated_at` | timestamptz | Zaman damgaları |

## Post kuralı

**User** hesapları yalnızca `group_id` dolu post oluşturabilir. Grup üyesi olmalıdır.

## RLS

- SELECT: herkes (secret gruplar için uygulama katmanı filtresi gelecek)
- Yazma: Edge/API

## İlgili

- [group_members.md](./group_members.md)
- [posts.md](./posts.md)
