# group_members

## Amaç

Profillerin **grup üyeliği**, rolü ve durumu.

## İlişkiler

- `group_id` → `groups`
- `profile_id` → `profiles`

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `group_id` | uuid PK (composite) | Grup |
| `profile_id` | uuid PK (composite) | Üye profil |
| `role` | member_role | owner, admin, moderator, member, editor |
| `status` | member_status | active, pending, banned, left |
| `banned_until` | timestamptz | Geçici ban bitişi |
| `banned_reason` | text | Ban gerekçesi |
| `created_at` | timestamptz | Katılım |

## Post yetkisi

Aktif üye (`status = active`) olan profil gruba post atabilir (`validate_post_placement`).

## RLS

- SELECT: authenticated
- Yazma: Edge/API

## Helper

`private.is_group_member(group_id, profile_id, active_only?)`
