# content-pipeline-collect

## Amaç

İçerik pipeline **audit kaydı** — idempotent upsert. v1'de hemen `done` işaretler; gerçek NLP/moderasyon pipeline'ı gelecek.

## Kimlik

JWT **kapalı** — service role key zorunlu

## İstek

```json
{
  "resourceType": "post | media | comment",
  "resourceId": "uuid",
  "idempotencyKey": "unique-key",
  "context": { "source": "create-post" },
  "requestId": "correlation-id"
}
```

## Yanıt (200)

```json
{ "runId": "uuid", "status": "done" }
```

## Davranış

1. `content_pipeline_runs` upsert (`onConflict: idempotency_key`)
2. Status → `done` (v1 skeleton)

## İlgili

[content_pipeline_runs](../tables/content_pipeline_runs.md)

## Notlar

`create-post` zaten pipeline kaydı oluşturur; bu function ayrı worker/webhook entegrasyonu için
