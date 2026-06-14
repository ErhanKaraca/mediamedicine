# Communication kanal plugin'leri

Dizin: `supabase/functions/_shared/communication/channels/`

## Arayüz

```typescript
interface ChannelPlugin {
  channel: NotificationChannel;
  deliver(ctx: DeliverContext): Promise<DeliverResult>;
}
```

## v1 kanallar

| Plugin | Durum | Provider |
|--------|-------|----------|
| `realtime.ts` | Gerçek | Supabase Realtime broadcast API |
| `push.ts` | Gerçek | FCM HTTP v1 (`jose` JWT) |
| `email.ts` | Gerçek | Resend |
| `sms.ts` | Gerçek | Twilio |
| `telegram.ts` | Gerçek | Telegram Bot API |
| `slack.ts` | Stub | `skipped: channel_not_configured_v1` |
| `whatsapp.ts` | Stub | Aynı |

## Template

`notification_templates` tablosundan `{{var}}` replace ile subject/body üretilir.

## Router

`_shared/communication/router.ts` — global kanal kill switch (`system_settings.communication.enabled_channels`), kullanıcı tercihi (`should_notify_channel` RPC).
