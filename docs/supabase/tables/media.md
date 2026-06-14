# media

## Amaç

Storage'a yüklenen **dosya metadata'sı**. Post medyası, video ve eklerin lifecycle'ını takip eder.

## İlişkiler

- `owner_profile_id` → dosyanın ait olduğu profil
- `uploader_user_id` → yükleyen auth user
- `post_media` → posta bağlama

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Medya ID (Storage path'te de kullanılır) |
| `owner_profile_id` | uuid | Sahip profil |
| `uploader_user_id` | uuid | Yükleyen |
| `kind` | media_kind | image, video, document |
| `bucket` | text | Storage bucket adı |
| `storage_path` | text | `{profile_id}/{media_id}.ext` |
| `original_name` | text | Orijinal dosya adı |
| `mime_type` | text | MIME |
| `file_size` | bigint | Byte cinsinden boyut |
| `width`, `height` | int | Görsel boyutları |
| `duration_ms` | int | Video süresi |
| `blurhash` | text | Placeholder hash |
| `variants` | jsonb | Transcode/resize çıktıları |
| `status` | media_status | pending → ready/processing/failed |
| `processing_error` | text | Hata mesajı |
| `created_at` | timestamptz | Oluşturma |

## Unique

`(bucket, storage_path)` — aynı path iki kez olamaz

## Lifecycle

```
pending (upload-init)
  → upload Storage
  → ready veya processing (finalize)
  → post_media ile posta bağlanır
```

## RLS

- SELECT: authenticated
- INSERT/UPDATE: uploader = auth.uid()

## Edge Functions

- [media-upload-init](../edge-functions/media-upload-init.md)
- [media-finalize](../edge-functions/media-finalize.md)

## Storage

[storage.md](../storage.md)
