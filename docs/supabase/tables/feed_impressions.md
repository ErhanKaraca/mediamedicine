# feed_impressions

## Amaç

Feed **etkileşim olayları** — implicit ilgi profili ve analitik için. `feed_seen_items`'tan ayrı; dwell/click/dismiss içerir.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | |
| `profile_id` | uuid | Okuyucu profil |
| `post_id` | uuid | Hedef post |
| `event_type` | feed_impression_event | impression, click, dwell, dismiss |
| `dwell_ms` | int | Kalma süresi (dwell için) |
| `feed_surface` | feed_surface | home, group, profile |
| `created_at` | timestamptz | |

## Retention

90 gün prune (cron — gelecek). v1'de sınırsız insert.

## RLS

- INSERT/SELECT: profil sahibi

## API (gelecek)

`POST /v1/feed/impressions` batch

## İlgili

- [feed_seen_items.md](./feed_seen_items.md) — basit görüldü dedup
- [user_specialty_weights.md](./user_specialty_weights.md)
