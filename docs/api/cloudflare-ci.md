# Cloudflare Workers — GitHub CI/CD

Cloudflare Dashboard → Workers & Pages → **mediamedicine-api** → Settings → Builds

## Önerilen ayarlar

| Alan | Değer |
|------|--------|
| **Root directory** | `apps/api` |
| **Build command** | `pnpm run build` |
| **Deploy command** | `pnpm run deploy` |

Monorepo kökünde `pnpm install` otomatik çalışır (Cloudflare build ortamı). `build` script'i önce `@mediamedicine/shared` derler, sonra wrangler dry-run yapar.

## Production ortamı

Deploy **mutlaka** production env ile yapılmalı:

```bash
wrangler deploy --env production
```

`package.json` içindeki `deploy` script'i bunu zaten içerir. Dashboard'da `npx wrangler deploy` **kullanmayın** — development vars ve localhost CORS ile gider.

Production deploy sonrası beklenen bindings:

- `ENVIRONMENT`: `production`
- `CORS_ORIGINS`: mediamedicine.net domainleri
- Custom domain: `api.mediamedicine.net`

## Secrets (Dashboard veya Wrangler)

**Önerilen yol:** `wrangler secret bulk` (kalıcı, deploy sonrası silinmez)

```bash
cd apps/api
npx wrangler secret bulk secrets.json --env production
pnpm run deploy
```

Dashboard → Worker → **Variables and Secrets** (Build içindeki değil) → **Production** → **Secret** olarak da eklenebilir.

### Sık hata: Dashboard variable → Git deploy ile silinir

Dashboard'dan **plain text Variable** eklediyseniz, sonraki `wrangler deploy` (GitHub CI) bu değişkenleri **sıfırlayabilir**. Wrangler `secret list --env production` boş döner; health'te `"supabase":"down"` görürsünüz.

**Doğrulama:**

```bash
npx wrangler secret list --env production   # 4 secret görünmeli
curl https://api.mediamedicine.net/v1/health  # "supabase":"ok"
npx wrangler versions view <VERSION_ID> --env production
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
npx wrangler kv namespace create SESSION_CACHE --env production
npx wrangler kv namespace create SESSION_CACHE --preview --env production
```

Çıkan `id` / `preview_id` değerlerini `wrangler.jsonc` → `env.production.kv_namespaces` içine yazın.

Mevcut production namespace ID: `345d6c8394444cdeac93349146271ef1`

### Development vars ile deploy

Log'da `ENVIRONMENT: "development"` görüyorsanız deploy command `--env production` eksiktir.

### Durable Objects ilk deploy

İlk production deploy'da `RateLimiter` ve `IdempotencyStore` migration otomatik uygulanır (`wrangler.jsonc` → `migrations`).

## Deploy sonrası test

```bash
curl https://api.mediamedicine.net/v1/health
```

Beklenen: `"status":"ok"`, `"supabase":"ok"` (secret'lar doğruysa).
