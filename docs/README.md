# MediaMedicine Dokümantasyonu

Bu klasör, **mediamedicine** monoreposunun teknik referans dokümantasyonunu içerir. Yapı, proje büyüdükçe yeni katmanlar ve alt klasörler eklenecek şekilde tasarlanmıştır.

## Klasör haritası

| Klasör | İçerik |
|--------|--------|
| [supabase/](./supabase/) | Veritabanı şeması, RLS, Storage, Edge Functions |
| [api/](./api/) | Cloudflare Workers API katmanı (Faz 2) |
| *(gelecek)* `web/` | Next.js istemci |
| *(gelecek)* `mobile/` | Flutter istemci |

## Supabase katmanı (Faz 1 — tamamlandı)

Cloud proje: **mm-prod** (`byehsoceqvvxeqejicag`, `eu-central-1`)

- [Supabase genel bakış](./supabase/README.md)
- [Mimari ve kimlik modeli](./supabase/architecture.md)
- [Enum ve tipler](./supabase/enums-and-types.md)
- [Veritabanı yardımcı fonksiyonları](./supabase/database-helpers.md)
- [Row Level Security](./supabase/rls.md)
- [Storage bucket'ları](./supabase/storage.md)
- [Feed ranking — Supabase katmanı](./supabase/feed-ranking.md)

### Tablolar

Her tablo için ayrı referans dosyası: [supabase/tables/](./supabase/tables/)

### Edge Functions

Her function için ayrı referans dosyası: [supabase/edge-functions/](./supabase/edge-functions/)

## API katmanı (Faz 2 — iskelet)

- [API genel bakış](./api/README.md)
- [Auth proxy](./api/auth.md)
- [Route haritası](./api/routes.md)

Kaynak: `apps/api/`, `packages/shared/`, `packages/api-client/`

## Kaynak kod eşlemesi

| Dokümantasyon | Kaynak |
|---------------|--------|
| Migration'lar | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| Lokal seed | `supabase/seed.sql` |
| CLI yapılandırması | `supabase/config.toml` |
| Platform planı | `.cursor/plans/social_graph_platform_dd42bd33.plan.md` |

## Dokümantasyon güncelleme kuralı

Yeni tablo, edge function veya bucket eklendiğinde:

1. İlgili migration / function kodunu yaz
2. `docs/supabase/tables/` veya `edge-functions/` altına yeni `.md` dosyası ekle
3. İlgili `README.md` indeksine link ekle
4. Gerekirse `architecture.md`, `enums-and-types.md` veya `rls.md` güncelle
