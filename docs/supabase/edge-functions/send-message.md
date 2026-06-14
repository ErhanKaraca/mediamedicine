# send-message

Conversation'a mesaj gönderir. Katılımcılara `message` bildirimi (push/email ayara göre).

**JWT:** açık

```json
{
  "conversationId": "uuid",
  "senderProfileId": "uuid",
  "content": {},
  "contentPlain": "Merhaba",
  "attachments": []
}
```

Max 2000 karakter plain text.
