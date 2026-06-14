# post_specialties

## Amaç

Post ↔ specialty **çoka-çok** bağlantısı. Her post en az bir uzmanlık alanına bağlı olmalı (pro/page zorunlu; grup postu inherit ile).

## Kolonlar

| Kolon | Açıklama |
|-------|----------|
| `post_id` | Post |
| `specialty_id` | Specialty |

PK: `(post_id, specialty_id)`

## Kurallar

- Max 3 specialty/post (edge config)
- Pro/page: deferrable trigger ile min 1 doğrulama
- Grup postu: `inherit_group_specialties` trigger

## RLS

- SELECT: herkes
- INSERT: post actor

## Feed kullanımı

SpecialtyDiscovery, Academic ve GroupSpecialty pool aday filtreleri.
