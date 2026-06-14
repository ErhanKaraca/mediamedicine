# post_evidences

## Amaç

Professional ve page postlarında zorunlu **kanıt/kaynak** kayıtları. Tıbbi içerik güvenilirliği ve atıf için.

## İlişkiler

- `post_id` → `posts` (cascade delete)

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | uuid PK | Kanıt satırı |
| `post_id` | uuid | Bağlı post |
| `display_order` | int | Sıralama (0-based) |
| `source_type` | evidence_source_type | Kaynak türü |
| `identifier_type` | evidence_identifier_type | DOI, PMID vb. |
| `identifier_value` | text | Tanımlayıcı değer |
| `title` | text | Yayın/başlık |
| `authors` | text | Yazarlar |
| `publisher` | text | Yayıncı |
| `pub_year` | int | Yayın yılı (1000–3000) |
| `url` | text | Harici link |
| `note` | text | Serbest not |
| `created_at` | timestamptz | Oluşturma |

## Kurallar

- Professional/page postlarında **en az 1** kanıt (`create-post` edge doğrular)
- Max 20 kanıt/post (`MAX_EVIDENCES_PER_POST`)

## RLS

- SELECT: herkes
- INSERT: post'un `actor_user_id` = auth.uid()

## Enum referansı

[enums-and-types.md](../enums-and-types.md#kanıt-evidence)
