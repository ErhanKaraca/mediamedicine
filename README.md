# mediamedicine

Supabase tabanlı, Cloudflare Workers üzerinde çalışan, yüksek yük altında ölçeklenebilir bir sosyal medya platformu. Web (Next.js) ve mobil (Flutter) istemcileri aynı monorepo'da barındırır.

## Mimari özet

- **API**: Cloudflare Worker (Hono) — versiyonlama, rate limit, idempotency, caching, exception handling, telemetri (Cloudflare-native: Durable Objects + KV + Cache API + Analytics Engine).
- **Backend**: Supabase — Postgres (+ RLS), Auth, Realtime, Storage, Edge Functions (ağır işler).
- **Web**: Next.js (React + TanStack Query + Tailwind).
- **Mobil**: Flutter (Riverpod) — API erişimi OpenAPI'den üretilen Dart client ile.

## Repo yapısı (hedef)

```
apps/
  api/        # Cloudflare Worker (Hono)            [Faz 2]
  web/        # Next.js                              [Faz 3]
  mobile/     # Flutter (JS workspace dışı)          [Faz 4]
packages/
  shared/     # zod şemalar, tipler, hata kodları
  api-client/ # tip-güvenli API client SDK
  config/     # paylaşılan tsconfig/eslint/tailwind
supabase/     # config, migrations, functions, seed  [Faz 1]
openapi/      # üretilen openapi.json
```

## Fazlar

1. **Faz 1 — Supabase temeli** (mevcut): şema, RLS, storage, Edge Functions iskeleti.
2. **Faz 2 — API**: Cloudflare Worker.
3. **Faz 3 — Web**: Next.js.
4. **Faz 4 — Mobil**: Flutter.

## Faz 1: Supabase yerel geliştirme

Önkoşullar: [Supabase CLI](https://supabase.com/docs/guides/cli) ve Docker.

```bash
# Yerel Supabase stack'ini başlat (Postgres, Auth, Storage, Studio...)
supabase start

# Şemayı ve seed'i sıfırdan uygula
supabase db reset

# Durdur
supabase stop
```

`supabase start` çıktısındaki `API URL`, `anon key`, `service_role key` ve `Studio URL` değerlerini not edin; sonraki fazlarda API ve istemciler bunları kullanır.

### Migration ekleme

```bash
supabase migration new <aciklayici_ad>
# SQL'i yaz, sonra:
supabase db reset   # tüm migration + seed'i tekrar uygular
```
