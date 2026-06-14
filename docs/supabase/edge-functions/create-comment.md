# create-comment

## Amaç

Post altına **yorum** ekler (thread destekli, max 3 derinlik).

## Kimlik

JWT **gerekli**

## İstek

```json
{
  "postId": "uuid",
  "authorProfileId": "uuid",
  "parentCommentId": "uuid | null",
  "content": { "root": { } },
  "contentPlain": "Yorum metni"
}
```

## Yanıt (201)

```json
{ "commentId": "uuid" }
```

## Kurallar

- `contentPlain` max 2000 karakter
- Parent varsa derinlik ≤ 3 (DB trigger da doğrular)
- Post görünür olmalı (`can_view_post`)

## Yan etkiler

- `posts.comment_count` trigger ile artar

## İlgili

[comments](../tables/comments.md)
