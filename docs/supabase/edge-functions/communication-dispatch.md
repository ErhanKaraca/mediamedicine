# communication-dispatch

## Amaç

`notification_deliveries` outbox satırlarını batch olarak işler ve kanal plugin'leri üzerinden gerçek iletimi yapar (push, email, sms, telegram, realtime).

## Kimlik

JWT **kapalı** — `Authorization: Bearer {SERVICE_ROLE_KEY}` veya `X-Cron-Secret: {COMMUNICATION_CRON_SECRET}`

## İstek

```json
{ "batchSize": 50 }
```

## Akış

1. `claim_pending_notification_deliveries` RPC ile satırları kilitle
2. Kullanıcı/sistem ayarı son kontrolü
3. Kanal plugin `deliver()`
4. `sent` | `skipped` | `failed` + exponential backoff (`next_retry_at`)

## Yanıt

```json
{ "processed": 10, "sent": 7, "failed": 1, "skipped": 2 }
```

## Secrets

| Secret | Kanal |
|--------|-------|
| `FCM_SERVICE_ACCOUNT_JSON` | push |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | email |
| `TWILIO_*` | sms |
| `TELEGRAM_BOT_TOKEN` | telegram |

## İlgili

[communication-channels.md](./communication-channels.md) · [emit-notification.md](./emit-notification.md)
