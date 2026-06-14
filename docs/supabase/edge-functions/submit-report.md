# submit-report

## Amaç

İçerik veya profil için **şikayet** oluşturur.

## Kimlik

JWT **gerekli**

## İstek

```json
{
  "reporterProfileId": "uuid",
  "targetType": "post | comment | profile | message",
  "targetId": "uuid",
  "reasonCode": "spam",
  "details": "Opsiyonel açıklama"
}
```

## Yanıt (201)

```json
{ "reportId": "uuid" }
```

## Kurallar

- Reporter profil sahibi = auth user
- `status` varsayılan: `open`

## İlgili

[reports](../tables/reports.md)
