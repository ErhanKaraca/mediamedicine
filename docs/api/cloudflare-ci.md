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

## Secrets (Dashboard)

Workers & Pages → **mediamedicine-api** → Settings → **Variables and Secrets**

Production environment için **Secret** olarak ekleyin:

| Name | Kaynak |
|------|--------|
| `SUPABASE_URL` | `https://byehsoceqvvxeqejicag.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API (service_role) |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard → API → JWT Secret |

Wrangler CLI ile `secret bulk` kullanmıyorsanız hepsi burada tanımlı olmalı.

## Bilinen hatalar

### `You need to enable Analytics Engine` (code: 10089)

Dashboard → Workers → Analytics Engine → Enable. Dataset adı `mediamedicine_api` (`wrangler.jsonc` binding ile aynı). Binding production env içinde tanımlıdır; miras alınmaz.

### Development vars ile deploy

Log'da `ENVIRONMENT: "development"` görüyorsanız deploy command `--env production` eksiktir.

### Durable Objects ilk deploy

İlk production deploy'da `RateLimiter` ve `IdempotencyStore` migration otomatik uygulanır (`wrangler.jsonc` → `migrations`).

## Deploy sonrası test

```bash
curl https://api.mediamedicine.net/v1/health
```

Beklenen: `"status":"ok"`, `"supabase":"ok"` (secret'lar doğruysa).
