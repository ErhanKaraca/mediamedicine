# link_previews

## Amaç

URL'ler için **Open Graph / meta önizleme cache'i**. Composer'da link yapıştırıldığında title, description, image gösterimi.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `url_hash` | text PK | SHA-256(url) — dedup anahtarı |
| `url` | text | Orijinal URL |
| `title` | text | og:title |
| `description` | text | og:description |
| `image_url` | text | og:image |
| `site_name` | text | og:site_name |
| `fetched_at` | timestamptz | Son fetch zamanı |

## Cache politikası

Edge `link-preview`: 24 saatten eski kayıtlar yeniden fetch edilir.

## RLS

- SELECT: anon + authenticated
- Yazma: service role (edge function)

## Edge Function

[link-preview](../edge-functions/link-preview.md)
