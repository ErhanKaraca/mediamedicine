# messages

| Kolon | Tip |
|-------|-----|
| `id` | uuid PK |
| `conversation_id` | uuid FK |
| `sender_profile_id` | uuid FK |
| `actor_user_id` | uuid FK |
| `content` | jsonb (Lexical) |
| `content_plain` | text (max 2000) |
| `attachments` | jsonb |
| `created_at` / `edited_at` / `deleted_at` | timestamptz |

Realtime publication aktif.

Edge: [send-message](../edge-functions/send-message.md)
