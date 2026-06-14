# get-or-create-conversation

İki profil arasında direct DM conversation bulur veya oluşturur. `can_message` kuralları ve block filtresi uygulanır.

**JWT:** açık · Body: `{ myProfileId, otherProfileId }`

Yanıt: `{ conversationId, created }`
