# Edge Functions — İndeks

Privileged yazma işlemleri, bildirim/communication platformu ve async iskeletler. Kaynak: `supabase/functions/`

## Kimlik doğrulama

| verify_jwt | Functions |
|------------|-----------|
| **true** | media-upload-init, media-finalize, create-post, create-comment, toggle-reaction, submit-report, register-device, toggle-follow, toggle-block, manage-group-membership, submit-professional-application, get-or-create-conversation, send-message, mark-conversation-read, edit-message, delete-message, record-feed-impressions, moderate-target, review-professional-application |
| **false** | link-preview, emit-notification, content-pipeline-collect, communication-dispatch |

JWT kapalı function'lar kendi iç doğrulamasını yapar (service role header veya cron secret).

## Mimari

```
Domain edge → emit-notification → notification_deliveries (outbox)
                                        ↓
                              communication-dispatch → kanal plugin'leri
```

Detay: [communication-dispatch.md](./communication-dispatch.md) · [communication-channels.md](./communication-channels.md)

## Function listesi

| Function | Amaç | Dokümantasyon |
|----------|------|---------------|
| `media-upload-init` | Signed upload URL + media kaydı | [media-upload-init.md](./media-upload-init.md) |
| `media-finalize` | Upload tamamlandı işareti | [media-finalize.md](./media-finalize.md) |
| `create-post` | Post oluşturma | [create-post.md](./create-post.md) |
| `link-preview` | URL OG meta cache | [link-preview.md](./link-preview.md) |
| `create-comment` | Yorum oluşturma | [create-comment.md](./create-comment.md) |
| `toggle-reaction` | Like toggle | [toggle-reaction.md](./toggle-reaction.md) |
| `submit-report` | Şikayet gönderme | [submit-report.md](./submit-report.md) |
| `emit-notification` | Bildirim + outbox | [emit-notification.md](./emit-notification.md) |
| `communication-dispatch` | Outbox tüketici, çok kanallı iletim | [communication-dispatch.md](./communication-dispatch.md) |
| `register-device` | Push token kaydı | [register-device.md](./register-device.md) |
| `content-pipeline-collect` | Pipeline audit | [content-pipeline-collect.md](./content-pipeline-collect.md) |
| `toggle-follow` | Takip / takibi bırak | [toggle-follow.md](./toggle-follow.md) |
| `toggle-block` | Engelle / engeli kaldır | [toggle-block.md](./toggle-block.md) |
| `manage-group-membership` | Grup üyeliği yönetimi | [manage-group-membership.md](./manage-group-membership.md) |
| `submit-professional-application` | Profesyonel başvuru | [submit-professional-application.md](./submit-professional-application.md) |
| `get-or-create-conversation` | DM conversation bul/oluştur | [get-or-create-conversation.md](./get-or-create-conversation.md) |
| `send-message` | Mesaj gönder | [send-message.md](./send-message.md) |
| `mark-conversation-read` | Okundu işareti | [mark-conversation-read.md](./mark-conversation-read.md) |
| `edit-message` | Mesaj düzenle | [edit-message.md](./edit-message.md) |
| `delete-message` | Mesaj sil (soft) | [delete-message.md](./delete-message.md) |
| `record-feed-impressions` | Feed etkileşim batch | [record-feed-impressions.md](./record-feed-impressions.md) |
| `moderate-target` | Staff moderasyon | [moderate-target.md](./moderate-target.md) |
| `review-professional-application` | Staff başvuru onayı | [review-professional-application.md](./review-professional-application.md) |

## Paylaşılan modüller

[_shared.md](./_shared.md) — config, auth, cors, response, log, notifications, communication

## Çağrı URL formatı

```
POST https://byehsoceqvvxeqejicag.supabase.co/functions/v1/{function-name}
Authorization: Bearer {user_jwt | service_role_key}
Content-Type: application/json
```

## Yeni function ekleme

1. `supabase/functions/{name}/index.ts` oluştur
2. `supabase/config.toml` → `[functions.{name}]` verify_jwt ayarı
3. `docs/supabase/edge-functions/{name}.md` dokümantasyon
4. Bu README'ye satır ekle
5. `supabase functions deploy {name}`
