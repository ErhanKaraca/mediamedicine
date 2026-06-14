# content_pipeline_runs

## Amaç

İçerik oluşturma/güncelleme olaylarının **pipeline audit ve idempotency** kaydı. Moderasyon, NLP, spam skoru, medya işleme gibi async adımlar için iskelet.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Run ID |
| `resource_type` | text | post, media, comment |
| `resource_id` | uuid | Hedef kaynak |
| `actor_user_id` | uuid | Tetikleyen user |
| `actor_profile_id` | uuid | Tetikleyen profil |
| `idempotency_key` | text unique | Tekrar güvenli anahtar |
| `pipeline_version` | text | Pipeline sürümü (v1) |
| `context` | jsonb | Olay bağlamı |
| `status` | text | context_recorded, processing, done, failed |
| `source` | text | edge_function, api, webhook |
| `request_id` | text | Korelasyon ID |
| `created_at`, `updated_at` | timestamptz | Zaman damgaları |

## v1 davranış

`create-post` insert eder; `content-pipeline-collect` hemen `done` işaretler (gerçek pipeline gelecek).

## RLS

RLS açık, **client policy yok** — service role only.

## Edge Functions

- [create-post](../edge-functions/create-post.md) — otomatik insert
- [content-pipeline-collect](../edge-functions/content-pipeline-collect.md)
