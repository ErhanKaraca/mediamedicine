# media-finalize

## Amaç

Storage upload tamamlandıktan sonra `media.status` günceller.

## Kimlik

JWT **gerekli**

## İstek

```json
{ "mediaId": "uuid" }
```

## Yanıt (200)

```json
{ "mediaId": "uuid", "status": "ready" }
```

Video için `status: "processing"` (transcode pipeline gelecek).

## Kurallar

- Yalnızca `uploader_user_id = auth.uid()`
- Yalnızca `status = pending` iken finalize edilir

## Hatalar

| code | Durum |
|------|-------|
| not_found | Medya yok |
| forbidden | Başkasının upload'ı |
| invalid_state | Zaten finalize edilmiş |

## Akış

```
media-upload-init → Storage PUT → media-finalize → create-post (mediaIds)
```
