# MediaMedicine API (Faz 2)

Cloudflare Workers üzerinde Hono tabanlı REST API. İstemciler yalnızca bu katmanı bilir; Supabase URL ve anahtarları istemciye sızmaz.

## Mimari

```
İstemci → Cloudflare Worker (/v1)
           ├─ Auth proxy → Supabase GoTrue
           ├─ Write proxy → Supabase Edge Functions (28 function)
           └─ Read routes → PostgREST (user-scoped JWT, RLS)
```

Detaylı auth akışı: [auth.md](./auth.md)  
Route ↔ edge eşlemesi: [routes.md](./routes.md)

## Lokal geliştirme

```bash
# Supabase (Postgres + GoTrue)
supabase start

# Bağımlılıklar
pnpm install
pnpm --filter @mediamedicine/shared build

# Worker secrets
cp apps/api/.dev.vars.example apps/api/.dev.vars
# .dev.vars içine supabase status çıktısındaki URL ve anahtarları yazın

pnpm --filter @mediamedicine/api dev
```

Worker varsayılan olarak `http://127.0.0.1:8787` adresinde çalışır.

## Ortam değişkenleri (Worker secrets)

| Secret | Açıklama |
|--------|----------|
| `SUPABASE_URL` | Supabase proje URL |
| `SUPABASE_ANON_KEY` | Anon key (auth proxy + user client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (yalnızca sunucu tarafı) |
| `SUPABASE_JWT_SECRET` | JWT doğrulama (GoTrue ile aynı secret) |
| `CORS_ORIGINS` | Virgülle ayrılmış origin allowlist |
| `ENVIRONMENT` | `development` \| `staging` \| `production` |

## OpenAPI

Canlı spec: `GET /v1/openapi.json`

Statik export (Dart client kaynağı):

```bash
pnpm --filter @mediamedicine/api openapi:export
```

Çıktı: [`openapi/openapi.json`](../../openapi/openapi.json)

## Hata formatı

Tüm hatalar edge function'larla uyumlu:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Missing or invalid Authorization header",
    "requestId": "uuid"
  }
}
```

## SDK

```typescript
import { createClient } from "@mediamedicine/api-client";

const client = createClient("http://127.0.0.1:8787");
const session = await client.login("user@example.com", "password");
client.setAccessToken(session.accessToken);
await client.createPost({ authorProfileId: "...", body: "Hello" });
```

## Test

```bash
pnpm --filter @mediamedicine/api test
```

## Deploy

Production domain: **https://api.mediamedicine.net**

GitHub → Cloudflare CI ayarları: [cloudflare-ci.md](./cloudflare-ci.md)

```bash
pnpm --filter @mediamedicine/api deploy
```

Dashboard deploy command: `pnpm run deploy` (root: `apps/api`). Secret'lar Cloudflare Dashboard → Variables and Secrets üzerinden tanımlanır.
