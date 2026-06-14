# user_specialty_weights

## Amaç

**Implicit (örtük) ilgi** agregatı — impression/click/dwell olaylarından decay'li specialty ağırlıkları.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `profile_id` | uuid PK | |
| `specialty_id` | uuid PK | |
| `weight` | numeric | Güncel ağırlık (decay uygulanır) |
| `updated_at` | timestamptz | Son güncelleme |

## RLS

- Yalnızca profil sahibi

## Agregasyon

API worker (Faz D) `feed_impressions` olaylarını işleyerek günceller. Explicit `user_specialties` floor korunur.

## Feed kullanımı

`specialty_match = explicit + min(implicit, 0.6 cap)`
