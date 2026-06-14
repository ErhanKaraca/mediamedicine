# post_media

## Amaç

Post ile medya arasındaki **çoka-çok bağlantı** tablosu. Bir postta birden fazla medya, sıralı gösterim.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `post_id` | uuid PK (composite) | Post |
| `media_id` | uuid PK (composite) | Medya |
| `display_order` | int | Galeri sırası |
| `alt_text` | text | Erişilebilirlik metni |

## Kurallar

- Max 4 medya slot (`POST_MEDIA.maxSlots`)
- Max 1 video
- Medya `owner_profile_id` = post `author_profile_id` olmalı

## RLS

- SELECT: herkes
- INSERT: Edge `create-post` (service/user client)

## Notlar

- `posts.primary_media_id` genelde ilk medyayı işaret eder
