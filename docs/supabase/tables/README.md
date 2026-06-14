# Tablolar — İndeks

26 tablo → 30 tablo (messaging + notification_templates eklendi), migration dosyalarına göre gruplandırılmıştır.

## Kimlik ve ayarlar

| Tablo | Dosya |
|-------|-------|
| `platform_staff` | Operasyonel yetki (sosyal profilden bağımsız) | [platform_staff.md](./platform_staff.md) |
| `profiles` | [profiles.md](./profiles.md) |
| `professional_applications` | [professional_applications.md](./professional_applications.md) |
| `system_settings` | [system_settings.md](./system_settings.md) |
| `user_settings` | [user_settings.md](./user_settings.md) |

## Sayfa ve grup

| Tablo | Dosya |
|-------|-------|
| `pages` | [pages.md](./pages.md) |
| `page_members` | [page_members.md](./page_members.md) |
| `groups` | [groups.md](./groups.md) |
| `group_members` | [group_members.md](./group_members.md) |

## Sosyal graph

| Tablo | Dosya |
|-------|-------|
| `follows` | [follows.md](./follows.md) |
| `blocks` | [blocks.md](./blocks.md) |

## İçerik

| Tablo | Dosya |
|-------|-------|
| `posts` | [posts.md](./posts.md) |
| `post_evidences` | [post_evidences.md](./post_evidences.md) |
| `media` | [media.md](./media.md) |
| `post_media` | [post_media.md](./post_media.md) |
| `link_previews` | [link_previews.md](./link_previews.md) |
| `content_pipeline_runs` | [content_pipeline_runs.md](./content_pipeline_runs.md) |

## Etkileşim

| Tablo | Dosya |
|-------|-------|
| `comments` | [comments.md](./comments.md) |
| `reactions` | [reactions.md](./reactions.md) |

## Bildirimler

| Tablo | Dosya |
|-------|-------|
| `notification_event_types` | [notification_event_types.md](./notification_event_types.md) |
| `notifications` | [notifications.md](./notifications.md) |
| `user_notification_settings` | [user_notification_settings.md](./user_notification_settings.md) |
| `notification_deliveries` | [notification_deliveries.md](./notification_deliveries.md) |
| `user_devices` | [user_devices.md](./user_devices.md) |
| `notification_templates` | [notification_templates.md](./notification_templates.md) |

## Mesajlaşma

| Tablo | Dosya |
|-------|-------|
| `conversations` | [conversations.md](./conversations.md) |
| `conversation_participants` | [conversation_participants.md](./conversation_participants.md) |
| `messages` | [messages.md](./messages.md) |

## Moderasyon ve feed

| Tablo | Dosya |
|-------|-------|
| `reports` | [reports.md](./reports.md) |
| `moderation_actions` | [moderation_actions.md](./moderation_actions.md) |
| `feed_seen_items` | [feed_seen_items.md](./feed_seen_items.md) |
| `feed_impressions` | [feed_impressions.md](./feed_impressions.md) |

## Feed — uzmanlık ve ilgi

| Tablo | Dosya |
|-------|-------|
| `specialties` | [specialties.md](./specialties.md) |
| `post_specialties` | [post_specialties.md](./post_specialties.md) |
| `user_specialties` | [user_specialties.md](./user_specialties.md) |
| `group_specialties` | [group_specialties.md](./group_specialties.md) |
| `profile_specialties` | [profile_specialties.md](./profile_specialties.md) |
| `user_specialty_weights` | [user_specialty_weights.md](./user_specialty_weights.md) |

## Yeni tablo ekleme şablonu

Yeni tablo dokümanı şu bölümleri içermelidir:

1. **Amaç** — Tablo ne işe yarar?
2. **İlişkiler** — FK'lar ve bağlı tablolar
3. **Kolonlar** — Her kolonun anlamı
4. **Kısıtlar ve trigger'lar**
5. **RLS** — Kim ne yapabilir?
6. **İlgili Edge Functions / API**
7. **Notlar** — Gelecek geliştirmeler
