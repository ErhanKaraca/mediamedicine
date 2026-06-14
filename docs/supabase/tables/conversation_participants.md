# conversation_participants

| Kolon | Tip |
|-------|-----|
| `conversation_id` | uuid FK |
| `profile_id` | uuid FK |
| `last_read_at` | timestamptz |
| `joined_at` | timestamptz |

PK: `(conversation_id, profile_id)`

Edge: [mark-conversation-read](../edge-functions/mark-conversation-read.md)
