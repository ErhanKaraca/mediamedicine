# group_specialties

## Amaç

Grubun **konu/uzmanlık etiketleri**. Grup postlarında specialty inherit kaynağı.

## Kolonlar

| Kolon | Açıklama |
|-------|----------|
| `group_id` | Grup |
| `specialty_id` | Specialty |

## Inherit

Post `group_id` ile oluşturulduğunda ve `post_specialties` boşsa → `private.inherit_group_specialties` otomatik doldurur.

## RLS

- SELECT: herkes
- Yazma: service role / admin (v1)
