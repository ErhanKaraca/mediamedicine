# Cloudflare Workers — Web (Static SPA)

Cloudflare Dashboard → Workers & Pages → **mediamedicine-web** → Settings → Builds

## Önerilen ayarlar

| Alan | Değer |
|------|--------|
| **Root directory** | `apps/web` |
| **Build command** | `pnpm run build` |
| **Deploy command** (varsa) | `pnpm run deploy` |

Cloudflare Git entegrasyonu deploy adımını otomatik çalıştırır (`npx wrangler deploy`). `apps/web/wrangler.jsonc` repoda mevcut olduğu için Wrangler **otomatik kurulum** (npm install) tetiklenmez — pnpm monorepo ile çakışma önlenir.

## Production

- Worker adı: `mediamedicine-web`
- Çıktı: Vite `dist/`
- SPA yönlendirme: `not_found_handling: single-page-application`
- Custom domain: `app.mediamedicine.net`

## Lokal doğrulama

```bash
cd apps/web
pnpm run build
pnpm exec wrangler deploy --dry-run
```

## Bilinen hata: `run-s: not found` (deploy aşaması)

Wrangler repoda `wrangler.jsonc` bulamadığında otomatik kurulum yapar ve `npm install wrangler` çalıştırır. pnpm workspace içinde bu genelde başarısız olur. Çözüm: `apps/web/wrangler.jsonc` + `wrangler` devDependency (bu repoda tanımlı).
