# moderate-target

Platform staff moderasyon aksiyonu. `moderation_actions` audit kaydı + hedef güncelleme + bildirim.

**JWT:** açık + `platform_staff`

```json
{
  "targetType": "post|comment|profile|user",
  "targetId": "uuid",
  "action": "hide|remove|warn|ban|restore",
  "reason": "string?",
  "metadata": {}
}
```

## Hedef davranışları

| targetType | action | Etki |
|------------|--------|------|
| `post` | hide / remove / ban | `moderation_state`, remove/ban → `deleted_at` |
| `post` | restore | `moderation_state = none`, `deleted_at` null |
| `comment` | hide / remove / ban | `moderation_state`, remove/ban → `deleted_at` |
| `comment` | restore | `moderation_state = none`, `deleted_at` null |
| `profile` | hide | `visibility_settings.moderated_hidden = true` |
| `profile` | ban / remove | `deleted_at` (soft delete) |
| `profile` | restore | `deleted_at` null, moderated_hidden kaldırılır |
| `user` | ban / remove | Supabase Auth ban + tüm `profiles.deleted_at` |
| `user` | restore | Auth unban + tüm profiller restore |

`warn` yalnızca audit + (profile için) bildirim; DB state değişmez.

## Güvenlik

- UUID format doğrulaması (`_shared/uuid.ts`)
- Staff kontrolü: `assertPlatformStaff()`
