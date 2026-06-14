# record-feed-impressions

Batch feed etkileşim kaydı (`feed_impressions`). Max 50 event/istek.

**JWT:** açık

```json
{
  "profileId": "uuid",
  "events": [
    { "postId": "uuid", "eventType": "impression|click|dwell|dismiss", "feedSurface": "home|group|profile", "dwellMs": 3000 }
  ]
}
```
