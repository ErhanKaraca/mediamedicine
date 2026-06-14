# notification_templates

Kanal bazlı bildirim şablonları (`{{var}}` replace).

| Kolon | Tip |
|-------|-----|
| `key` | text — event type (like, message, …) |
| `channel` | text |
| `locale` | text (default tr) |
| `subject_template` | text (email) |
| `body_template` | text |

PK: `(key, channel, locale)`

Communication plugin'leri okur.
