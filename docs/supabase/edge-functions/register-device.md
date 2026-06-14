# register-device

## Amaç

Push bildirimi için cihaz token kaydı (`user_devices`).

## Kimlik

JWT **açık**

## İstek

```json
{
  "platform": "ios | android | web",
  "pushToken": "fcm-or-apns-token",
  "enabled": true
}
```

## Yanıt

```json
{ "deviceId": "uuid", "platform": "ios", "enabled": true }
```

## İlgili

[user_devices](../tables/user_devices.md) · communication `push` kanalı
