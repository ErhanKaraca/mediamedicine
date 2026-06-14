# specialties

## Amaç

Kontrollu **uzmanlık alanı kataloğu**. Serbest hashtag yerine platform yönetimli slug'lar; feed pool'ları ve ilgi profili bu tabloya bağlanır.

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | |
| `slug` | citext unique | `cardiology`, `internal_medicine` |
| `name_tr` | text | Türkçe ad |
| `name_en` | text | İngilizce ad |
| `parent_id` | uuid FK | Hiyerarşi (ör. Dahiliye > Kardiyoloji) |
| `sort_order` | int | UI sıralama |
| `is_active` | boolean | Pasif specialty seçilemez |
| `created_at` | timestamptz | |

## Seed (v1)

Kardiyoloji, Nöroloji, Ortopedi, Psikiyatri, Pediatri, Endokrinoloji, Dahiliye, Onkoloji, Acil Tıp, Farmakoloji

## RLS

- SELECT: herkes (`is_active = true`)

## İlgili

- [post_specialties.md](./post_specialties.md)
- [feed-ranking.md](../feed-ranking.md)
