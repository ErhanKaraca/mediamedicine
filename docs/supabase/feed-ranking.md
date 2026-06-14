# Feed Ranking — Supabase Katmanı

Ana sayfa feed algoritmasının **veritabanı ve edge function** altyapısı. Mixer, pool skorlama ve API endpoint'leri Cloudflare Workers'ta (Faz B+) uygulanacak; bu doküman yalnızca Supabase tarafını kapsar.

Tam plan: [.cursor/plans/feed_ranking_v2_6abd97cd.plan.md](../../.cursor/plans/feed_ranking_v2_6abd97cd.plan.md)

## Migration dosyaları

| Dosya | İçerik |
|-------|--------|
| `20260616100001_feed_specialties.sql` | `specialties`, junction tablolar, `content_type`, seed |
| `20260616100002_feed_quality_impressions.sql` | `quality_score`, `feed_impressions`, MQS fonksiyonu |
| `20260616100003_feed_rls.sql` | RLS + `can_view_post` genişletme |
| `20260616100004_feed_triggers.sql` | Grup specialty inherit, pro/page doğrulama |

## Yeni tablolar

| Tablo | Dokümantasyon |
|-------|---------------|
| `specialties` | [specialties.md](./tables/specialties.md) |
| `post_specialties` | [post_specialties.md](./tables/post_specialties.md) |
| `user_specialties` | [user_specialties.md](./tables/user_specialties.md) |
| `group_specialties` | [group_specialties.md](./tables/group_specialties.md) |
| `profile_specialties` | [profile_specialties.md](./tables/profile_specialties.md) |
| `user_specialty_weights` | [user_specialty_weights.md](./tables/user_specialty_weights.md) |
| `feed_impressions` | [feed_impressions.md](./tables/feed_impressions.md) |

## `posts` genişlemeleri

| Kolon / enum | Açıklama |
|--------------|----------|
| `content_type` | İçerik türü (case_study, guideline_update, …) — `post_type`'tan ayrı |
| `quality_score` | MedicalQualityScore 0–100 |

## MedicalQualityScore (MQS)

Postgres fonksiyonu: `private.compute_post_quality_score(post_id)`

| Sinyal | Puan |
|--------|------|
| Klinik kılavuz evidence | +40 |
| DOI / PMID / PMCID | +30 |
| Herhangi evidence | +15 |
| Yazar verified | +10 |
| Trust tier (pro/page/user) | +1–5 |

Evidence eklendiğinde trigger otomatik günceller. Edge `_shared/quality.ts` aynı formülü create-post'ta kullanır.

## Specialty kuralları

- Pro/page post: **en az 1 specialty** (edge + deferrable DB trigger)
- Grup postu: specialty verilmezse `group_specialties` otomatik inherit
- Max 3 specialty/post

## Feed yüzeyleri (API — sonraki faz)

| Yüzey | Supabase desteği |
|-------|------------------|
| Home mixer | Pool sorguları için index + specialty junction |
| Grup kronolojik | Mevcut `posts.group_id` index |
| Impression toplama | `feed_impressions` tablosu |
| Seen dedup | Mevcut `feed_seen_items` |

## Edge function güncellemeleri

[create-post](../edge-functions/create-post.md): `contentType`, `specialtyIds`, MQS

## Henüz yapılmadı (API fazı)

- 5-pool mixer, FinalScore, FeedSession DO
- `GET /v1/feed/home`, impression agregasyon worker
- KV specialty pool cache cron
