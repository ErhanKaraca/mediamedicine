# _shared (Edge Function modülleri)

`supabase/functions/_shared/` — tüm edge function'lar tarafından import edilen ortak kod.

## config.ts

Platform limitleri ve sabitler. İleride `packages/shared` ile senkron tutulacak.

| Export | Açıklama |
|--------|----------|
| `POST_BODY_MAX_CHARS` | 2000 |
| `COMMENT_MAX_DEPTH` | 3 |
| `POST_MEDIA` | Slot, video, boyut, MIME limitleri |
| `POST_ATTACHMENTS` | Ek dosya limitleri |
| `STORAGE_BUCKETS` | avatars, post-media, post-attachments, message-media |
| `EVIDENCE_SOURCE_TYPES` | Geçerli kanıt türleri |
| `MAX_EVIDENCES_PER_POST` | 20 |
| `NOTIFICATION_CHANNELS` | Desteklenen kanallar |

## feed.ts

Feed v2 sabitleri — Worker `packages/shared/config/feed.ts` ile ileride senkron.

| Export | Açıklama |
|--------|----------|
| `MAX_SPECIALTIES_PER_POST` | Post başına max specialty |
| `CONTENT_TYPES` | Geçerli `content_type` enum değerleri |
| `MQS_WEIGHTS` | MedicalQualityScore bileşen ağırlıkları |
| `ACADEMIC_CONTENT_TYPES` | Academic pool'a giren türler |

## quality.ts

| Fonksiyon | Açıklama |
|-----------|----------|
| `computeMedicalQualityScore(...)` | Postgres `private.compute_post_quality_score` ile uyumlu MQS (0–100) |

## auth.ts

| Fonksiyon | Açıklama |
|-----------|----------|
| `createUserClient(authHeader)` | Anon key + kullanıcı JWT — RLS uygulanır |
| `createAdminClient()` | Service role — RLS bypass |

## response.ts

| Fonksiyon | Açıklama |
|-----------|----------|
| `json(data, init?)` | JSON + CORS header |
| `errorResponse(code, message, status, extra?)` | Standart hata gövdesi `{ error: { code, message } }` |

## cors.ts

| Export | Açıklama |
|--------|----------|
| `corsHeaders` | Access-Control-Allow-* (prod'da origin sıkılaştırılacak) |
| `handlePreflight(req)` | OPTIONS → 200 |

## log.ts

Structured JSON logger — Supabase log drain uyumlu.

| Fonksiyon | Açıklama |
|-----------|----------|
| `createLogger({ fn, requestId? })` | debug/info/warn/error |

## supabase.ts

(Eski/iskelet — yeni function'lar auth.ts kullanır)

## notifications.ts

Domain event'lerden `emit-notification` çağrısı — best-effort, ana işlemi rollback etmez.

## staff.ts · social.ts · messaging.ts · uuid.ts · profile-ownership.ts

Staff doğrulama, follow/group const, mesajlaşma kuralları, UUID format doğrulama, profil sahipliği kontrolü.

| Modül | Export | Açıklama |
|-------|--------|----------|
| `uuid.ts` | `isValidUuid`, `findInvalidUuidField` | PostgREST filter enjeksiyonunu önlemek için |
| `profile-ownership.ts` | `isProfileOwnedByUser` | `profiles.owner_user_id === auth user` |

## communication/

Kanal plugin router — [communication-channels.md](./communication-channels.md)

## internal-auth.ts

Service role doğrulama — internal/cron edge function'lar için.

| Fonksiyon | Açıklama |
|-----------|----------|
| `requireServiceRole(req)` | `Authorization: Bearer ${serviceKey}` tam eşleşme (substring yok) |

Kullanan: `emit-notification`, `communication-dispatch`, `content-pipeline-collect`

## notification-channels.ts

| Fonksiyon | Açıklama |
|-----------|----------|
| `resolveChannelEnabled(admin, userId, profileId, eventType, channels[])` | Tek sorguda batch kanal ayarı — emit-notification N+1 fix |

## url-fetch.ts

Güvenli HTTP fetch — link preview ve benzeri dış URL çağrıları.

| Export | Açıklama |
|--------|----------|
| `safeFetch(url, init?)` | Private IP / metadata SSRF blocklist, max 3 redirect, timeout |

Kullanan: `link-preview`

## Import örneği

```typescript
import { handlePreflight } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/auth.ts";
import { json, errorResponse } from "../_shared/response.ts";
```
