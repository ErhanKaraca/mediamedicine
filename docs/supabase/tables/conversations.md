# conversations

Direct veya group DM sohbet kabuğu.

| Kolon | Tip |
|-------|-----|
| `id` | uuid PK |
| `type` | direct \| group_dm |
| `created_at` / `updated_at` | timestamptz |

Edge: [get-or-create-conversation](../edge-functions/get-or-create-conversation.md)
