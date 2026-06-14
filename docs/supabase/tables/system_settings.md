# system_settings

## Amaç

Platform genelinde staff tarafından yönetilen **runtime yapılandırma** anahtar-değer deposu.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `key` | text PK | Ayar anahtarı |
| `value` | jsonb | Ayar değeri (tip serbest JSON) |
| `description` | text | İnsan okunur açıklama |
| `updated_at` | timestamptz | Son güncelleme |
| `updated_by` | uuid | Güncelleyen staff kullanıcısı |

## Seed değerleri

| key | Açıklama |
|-----|----------|
| `notifications.defaults` | Yeni kullanıcı varsayılan kanallar |
| `feed.public_anon_enabled` | Anonim public feed okuma |
| `professional.application_auto_reject_days` | Başvuru otomatik red süresi |

## RLS

RLS açık, **client policy yok** — yalnızca service role / admin API.

## Kullanım

Edge Functions ve Cloudflare Workers bu tabloyu cache'leyerek okuyabilir.
