# emit-notification

## Amaç

**Bildirim oluşturur** ve kanal bazlı `notification_deliveries` outbox satırları yazar. Server-to-server — API Worker veya DB webhook tarafından çağrılır.

## Kimlik

JWT **kapalı** — `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}` zorunlu

## İstek

```json
{
  "recipientUserId": "uuid",
  "recipientProfileId": "uuid | null",
  "actorProfileId": "uuid | null",
  "eventType": "like",
  "entityType": "post",
  "entityId": "uuid",
  "title": "Bob gönderini beğendi",
  "body": "Opsiyonel kısa metin",
  "payload": { "deepLink": "/post/uuid" },
  "channels": ["in_app", "push"]
}
```

`channels` belirtilmezse tüm kanallar denenir.

## Yanıt (200)

```json
{
  "notificationId": "uuid",
  "deliveries": 2
}
```

## Kanal mantığı

| Kanal | Davranış |
|-------|----------|
| in_app | Anında `sent` |
| push, email, … | Kullanıcı ayarı açıksa `pending`, kapalıysa `skipped` |

Ayar çözümü: `user_notification_settings` → `notification_event_types.default_channels`

## Gelecek

Pending delivery insert sonrası `communication-dispatch` async tetiklenir (fire-and-forget).

[communication-dispatch.md](./communication-dispatch.md) pending satırları işler (push, email, sms, telegram, realtime).

## İlgili

[notifications](../tables/notifications.md) · [notification_deliveries](../tables/notification_deliveries.md)
