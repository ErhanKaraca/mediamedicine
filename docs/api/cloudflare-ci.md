# Cloudflare Workers — GitHub CI/CD

Cloudflare Dashboard → Workers & Pages → **mediamedicine-api** → Settings → Builds

## Önerilen ayarlar

| Alan | Değer |
|------|--------|
| **Root directory** | `apps/api` |
| **Build command** | `pnpm run build` |

Cloudflare Git entegrasyonu deploy adımını otomatik çalıştırır (`npx wrangler deploy`). Ayrı bir **Deploy command** alanı bazı dashboard sürümlerinde görünmez; bu normal.

Bu repo'da **root `wrangler.jsonc` = production** olacak şekilde yapılandırıldı. CI'daki varsayılan `npx wrangler deploy` doğrudan production'a gider — ek `--env production` gerekmez.

Lokal geliştirme: `pnpm dev` → `wrangler dev --env local`

## Production ortamı

Deploy sonrası beklenen bindings:

- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: mediamedicine.net domainleri
- Custom domain: `api.mediamedicine.net`
- `SESSION_CACHE` KV: `345d6c8394444cdeac93349146271ef1`

Deploy command alanını bulursan (Settings → Builds → düzenle / Edit configuration):

```
pnpm run deploy
```

Aynı sonucu verir; zorunlu değil.

- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: mediamedicine.net domainleri
- Custom domain: `api.mediamedicine.net`

## Secrets (Dashboard veya Wrangler)

**Önerilen yol:** `wrangler secret bulk` (kalıcı, deploy sonrası silinmez)

```bash
cd apps/api
npx wrangler secret bulk secrets.json
pnpm run deploy
```

Dashboard → Worker → **Variables and Secrets** (Build içindeki değil) → **Secret** olarak da eklenebilir.

### Sık hata: Dashboard variable → Git deploy ile silinir

Dashboard'dan **plain text Variable** eklediyseniz, sonraki `wrangler deploy` (GitHub CI) bu değişkenleri **sıfırlayabilir**. Wrangler `secret list` boş döner; health'te `"supabase":"down"` görürsünüz.

**Doğrulama:**

```bash
npx wrangler secret list   # 4 secret görünmeli
curl https://api.mediamedicine.net/v1/health  # "supabase":"ok"
npx wrangler versions view <VERSION_ID>
```

Aktif sürümde `ENVIRONMENT=production`, `CORS_ORIGINS` mediamedicine domainleri ve **secrets** bloğunda 4 Supabase secret olmalı.

| Name | Kaynak |
|------|--------|
| `SUPABASE_URL` | `https://byehsoceqvvxeqejicag.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API (service_role) |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → API → JWT Secret |

Plain text variable olarak değil, **Secret (encrypted)** kullanın.

## Bilinen hatalar

### `You need to enable Analytics Engine` (code: 10089)

Dashboard → Workers → Analytics Engine → Enable. Dataset adı `mediamedicine_api` (`wrangler.jsonc` binding ile aynı). Binding production env içinde tanımlıdır; miras alınmaz.

### `KV namespace not found` (code: 10041)

`SESSION_CACHE` binding için gerçek KV namespace gerekir. Placeholder ID kullanmayın.

```bash
cd apps/api
npx wrangler kv namespace create SESSION_CACHE
npx wrangler kv namespace create SESSION_CACHE --preview
```

Production root binding ID: `345d6c8394444cdeac93349146271ef1` (zaten `wrangler.jsonc` root'ta)

### Development vars ile deploy

Log'da `ENVIRONMENT: "development"` görüyorsanız root `wrangler.jsonc` production değildir. Güncel yapılandırmada root = production; lokal dev `--env local` kullanır.

### Durable Objects ilk deploy

İlk production deploy'da `RateLimiter` ve `IdempotencyStore` migration otomatik uygulanır (`wrangler.jsonc` → `migrations`).

## Deploy sonrası test

```bash
curl https://api.mediamedicine.net/v1/health
```

Beklenen: `"status":"ok"`, `"supabase":"ok"` (secret'lar doğruysa).
