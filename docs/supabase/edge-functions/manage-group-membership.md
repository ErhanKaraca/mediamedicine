# manage-group-membership

Grup üyeliği: join, leave, request, approve, reject, ban.

**JWT:** açık

```json
{
  "action": "join|leave|request|approve|reject|ban",
  "groupId": "uuid",
  "profileId": "uuid",
  "targetProfileId": "uuid?",
  "reason": "string?"
}
```

Join policy (`open|request|invite_only`) ve admin rol kontrolü edge'de yapılır.
