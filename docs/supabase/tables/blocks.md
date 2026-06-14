# blocks

## Amaç

Profiller arası **engelleme**. Engellenen ve engelleyen birbirinin içeriğini görmez (`is_blocked`, `can_view_post`).

## Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `blocker_profile_id` | uuid PK (composite) | Engelleyen |
| `blocked_profile_id` | uuid PK (composite) | Engellenen |
| `created_at` | timestamptz | Engel zamanı |

## Kısıtlar

- Kendini engelleyemez

## RLS

- Tüm işlemler: blocker profilin sahibi kullanıcı

## Notlar

- Çift yönlü simetrik kontrol: A→B veya B→A engeli görünürlüğü kapatır
- Mesajlaşma (Faz 2) engel listesini kullanacak
