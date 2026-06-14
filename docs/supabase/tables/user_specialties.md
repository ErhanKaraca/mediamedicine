# user_specialties

## Amaç

Kullanıcının **explicit (açık) uzmanlık ilgileri** — onboarding veya ayarlardan seçilir.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `profile_id` | uuid PK | Kullanıcı profili |
| `specialty_id` | uuid PK | Specialty |
| `source` | specialty_source | onboarding, manual, inferred |
| `weight` | numeric | Varsayılan 1.0 |
| `created_at` | timestamptz | |

## RLS

- Yalnızca profil sahibi CRUD

## Feed kullanımı

RelationshipScore specialty_match bileşeni; mixer profil seçimi.

## API (gelecek)

`PUT /v1/me/specialties`
