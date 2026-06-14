# page_members

## Amaç

Bir **sayfayı** yöneten profillerin üyelik ve rol kaydı. Page adına post atmak için owner/admin/editor rolü gerekir (`can_post_as`).

## İlişkiler

- `page_id` → `pages`
- `profile_id` → `profiles` — üye olan kişisel veya pro profil

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `page_id` | uuid PK (composite) | Sayfa |
| `profile_id` | uuid PK (composite) | Üye profil |
| `role` | member_role | owner, admin, moderator, member, editor |
| `status` | member_status | active, pending, banned, left |
| `created_at` | timestamptz | Katılım zamanı |

## Roller

| Rol | Post atma (page adına) |
|-----|------------------------|
| owner, admin, editor | Evet |
| moderator, member | Hayır (varsayılan) |

## RLS

- SELECT: authenticated
- Yazma: Edge/API (service role)

## Helper

`private.is_page_member(page_id, profile_id, roles?)`
