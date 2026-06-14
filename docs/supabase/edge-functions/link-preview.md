# link-preview

## Amaç

URL için **Open Graph meta** çeker ve `link_previews` tablosuna cache'ler. Composer link önizlemesi.

## Kimlik

JWT **kapalı** — public endpoint (rate limit API katmanında önerilir)

## İstek

```json
{ "url": "https://example.com/article" }
```

## Yanıt (200)

```json
{
  "url_hash": "sha256hex",
  "url": "https://example.com/article",
  "title": "...",
  "description": "...",
  "image_url": "...",
  "site_name": "...",
  "fetched_at": "ISO8601"
}
```

## Cache

- 24 saatten yeni kayıt varsa DB'den döner
- Fetch timeout: 8 saniye
- User-Agent: `MediaMedicineBot/1.0`

## Hatalar

| code | Durum |
|------|-------|
| invalid_url | http(s) değil |
| fetch_failed | Hedef site hata döndü |

## İlgili

[link_previews](../tables/link_previews.md)
