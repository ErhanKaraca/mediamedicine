# Storage Bucket'ları

Supabase Storage üzerinde dört bucket tanımlıdır.

Politikalar: `20260615000010_storage.sql`, `20260617000003_messaging_storage.sql`, `20260618000001_supabase_layer_closure.sql`  
Bucket tanımları: `supabase/config.toml`

## Bucket listesi

| Bucket | Public | Max boyut | Klasör yapısı | Amaç |
|--------|--------|-----------|---------------|------|
| `avatars` | Evet | 5 MiB | `{user_id}/…` | Profil avatarları |
| `post-media` | Hayır | 50 MiB | `{profile_id}/{media_id}.ext` | Post görselleri/videoları |
| `post-attachments` | Hayır | 5 MiB | `{profile_id}/…` | PDF, doc, csv ekleri |
| `message-media` | Hayır | 25 MiB | `{profile_id}/{media_id}.ext` | Mesaj ekleri |

## MIME kısıtları

### avatars
`image/png`, `image/jpeg`, `image/webp`

### post-media
`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`

### post-attachments
PDF, Office belgeleri, `text/plain`, `text/csv` (Edge `_shared/config.ts` ile uyumlu)

### message-media
`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`, `application/pdf`

## Erişim kuralları

### avatars
- **Okuma:** anon + authenticated (herkes)
- **Yazma/güncelleme/silme:** Yalnızca kendi `auth.uid()` klasörüne

### post-media / post-attachments / message-media
- **Okuma:** authenticated — `private.can_read_storage_object(bucket, path, auth.uid())`
  - Dosya sahibi (klasör = kendi profil ID'si)
  - Post medyası: `post_media` + `can_view_post()` ile görünür post
  - Mesaj medyası: katılımcı olduğu konuşmadaki mesaj eki
- **Yazma:** Kullanıcının sahip olduğu profil ID'si klasör adı olmalı (`profiles.owner_user_id = auth.uid()`)

Detay: [database-helpers.md](./database-helpers.md#privatecan_read_storage_object)

## Medya akışı

```
1. media-upload-init  → media satırı (pending) + signed upload URL
2. İstemci            → Storage'a doğrudan upload
3. media-finalize     → status: ready (video v1: processing → content-pipeline-collect → ready)
4. create-post        → post_media bağlantısı
```

## CDN (gelecek)

Production'da Cloudflare CDN önüne alınacak; bucket public URL'leri config sabiti olarak `packages/shared`'a taşınacak.

## `media` tablosu ilişkisi

Her Storage dosyası `media` tablosunda metadata ile eşlenir:

- `bucket` + `storage_path` → unique
- `owner_profile_id` → klasör adı ile uyumlu
- `status` → upload lifecycle

Detay: [tables/media.md](./tables/media.md)
