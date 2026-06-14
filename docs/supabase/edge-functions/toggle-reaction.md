# toggle-reaction

## Amaç

Post üzerinde **like toggle** — kayıt varsa siler, yoksa ekler.

## Kimlik

JWT **gerekli**

## İstek

```json
{
  "postId": "uuid",
  "profileId": "uuid",
  "type": "like"
}
```

## Yanıt (200)

```json
{
  "postId": "uuid",
  "profileId": "uuid",
  "type": "like",
  "active": true
}
```

`active: false` → like kaldırıldı.

## Kurallar

- Profil sahibi = auth user
- Post görünür olmalı

## Yan etkiler

- `posts.reaction_count` güncellenir
- Bildirim: API katmanı `emit-notification` tetikleyecek (gelecek)

## İlgili

[reactions](../tables/reactions.md)
