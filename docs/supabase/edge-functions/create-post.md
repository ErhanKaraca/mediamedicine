# create-post

## Amaç

Yeni **post** oluşturur: Lexical gövde, yerleşim, kanıtlar, uzmanlık alanları, içerik türü, MQS ve pipeline kaydı.

## Kimlik

JWT **gerekli**

## İstek

```json
{
  "authorProfileId": "uuid",
  "groupId": "uuid | null",
  "pageContextId": "uuid | null",
  "content": { "root": { } },
  "contentPlain": "Metin özeti",
  "postType": "standard",
  "contentType": "discussion",
  "quoteOfId": null,
  "visibility": "public",
  "mediaIds": ["uuid"],
  "specialtyIds": ["uuid"],
  "evidences": [
    {
      "sourceType": "publication",
      "identifierType": "doi",
      "identifierValue": "10.1234/example",
      "title": "Makale başlığı"
    }
  ],
  "idempotencyKey": "optional-unique-key"
}
```

## Yanıt (201)

```json
{
  "postId": "uuid",
  "qualityScore": 85
}
```

## İş kuralları

- `contentPlain` max 2000 karakter
- `contentType` — case_study, guideline_update, discussion, … (varsayılan: discussion)
- User hesabı → `groupId` zorunlu; specialty grup inherit ile otomatik
- Professional/page → en az 1 evidence **ve** en az 1 specialty (grup postu hariç inherit)
- Max 3 specialty, max 4 medya, max 1 video
- `qualityScore` — MedicalQualityScore; evidence trigger ile DB'de de güncellenir

## DB yan etkileri

- `posts` (+ `content_type`, `quality_score`)
- `post_specialties`, `post_evidences`, `post_media`
- Grup postu: `group_specialties` inherit trigger
- `content_pipeline_runs` insert

## Hatalar

| code | Açıklama |
|------|----------|
| evidence_required | Pro/page kanıtsız post |
| specialty_required | Pro/page specialty eksik |
| invalid_content_type | Geçersiz content_type |
| too_many_specialties | Max 3 |

## İlgili

[posts](../tables/posts.md) · [post_evidences](../tables/post_evidences.md) · [post_specialties](../tables/post_specialties.md) · [feed-ranking.md](../feed-ranking.md)
