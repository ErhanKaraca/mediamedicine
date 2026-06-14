# media-upload-init

## Amaç

Post medyası veya ek dosya yüklemeden önce **Storage signed upload URL** üretir ve `media` tablosunda `pending` kayıt açar.

## Kimlik

JWT **gerekli** — oturum açmış kullanıcı

## İstek

```http
POST /functions/v1/media-upload-init
Authorization: Bearer {user_jwt}
Content-Type: application/json
```

```json
{
  "ownerProfileId": "uuid",
  "kind": "image | video | document",
  "mimeType": "image/jpeg",
  "fileSize": 1048576,
  "originalName": "photo.jpg"
}
```

## Yanıt (200)

```json
{
  "mediaId": "uuid",
  "bucket": "post-media",
  "storagePath": "{profile_id}/{media_id}.jpg",
  "signedUrl": "https://...",
  "token": "..."
}
```

## Doğrulamalar

- MIME ve boyut: `_shared/config.ts` limitleri
- `kind=image` → post-media bucket
- `kind=document` → post-attachments bucket

## Hatalar

| code | Durum |
|------|-------|
| unauthorized | Oturum yok |
| unsupported_image_mime / image_too_large | Limit aşımı |
| insert_failed | RLS veya profil uyumsuzluğu |

## Sonraki adım

1. İstemci `signedUrl` ile dosyayı Storage'a yükler
2. [media-finalize](./media-finalize.md) çağrılır

## İlgili tablolar

[media](../tables/media.md) · [storage.md](../storage.md)
