# feed_seen_items

## Amaç

Feed **görüldü/görülmedi** deduplication iskeleti. Ranking algoritması ayrı planda; bu tablo aynı postun tekrar gösterilmesini engellemek için kullanılacak.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `profile_id` | uuid PK (composite) | Feed'i okuyan profil |
| `post_id` | uuid PK (composite) | Görülen post |
| `seen_at` | timestamptz | Görülme zamanı |

## Index

`(profile_id, seen_at desc)` — son görülenler sorgusu

## RLS

- Tüm işlemler: profil sahibi kullanıcı

## Gelecek

Feed ranking planı ile birlikte:
- Impression vs click ayrımı
- TTL / pruning stratejisi
- Fan-out-on-read vs fan-out-on-write kararı

## Notlar

v1'de API katmanı henüz bu tabloyu doldurmuyor — şema hazır
