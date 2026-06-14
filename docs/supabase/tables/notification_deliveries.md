# notification_deliveries

## Amaç

Bildirim **outbox** — kanal başına teslimat durumu. Push, email, SMS vb. async worker'lar bu tabloyu işler.

## İlişkiler

- `notification_id` → `notifications`

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Teslimat ID |
| `notification_id` | uuid | Ana bildirim |
| `channel` | text | Hedef kanal |
| `status` | text | pending, sent, failed, skipped |
| `skip_reason` | text | Örn. user_disabled |
| `provider_message_id` | text | FCM/SendGrid message ID |
| `error` | text | Hata detayı |
| `attempts` | int | Deneme sayısı |
| `created_at` | timestamptz | Kuyruğa alınma |
| `sent_at` | timestamptz | Başarılı gönderim |

## Index

`status = pending` partial index — worker sorguları için

## RLS

RLS açık, **client policy yok** — service role / communication worker

## Akış

```
emit-notification
  → in_app: status=sent (anında)
  → push/email/…: status=pending veya skipped
    → (gelecek) communication edge-function
```
