# Supabase Katmanı

MediaMedicine platformunun **veri ve privileged iş mantığı** katmanı. İstemciler (web/mobil) doğrudan hassas yazma işlemlerini mümkün olduğunca **Edge Functions** üzerinden yapar; okuma işlemleri RLS korumalı PostgREST ile yapılabilir.

## Proje bilgisi

| Alan | Değer |
|------|-------|
| Proje adı | mm-prod |
| Project ref | `byehsoceqvvxeqejicag` |
| Bölge | eu-central-1 |
| Postgres | 17 |
| Şema | `public` (API), `private` (yardımcılar, trigger'lar) |

## Katman sorumlulukları

```
auth.users          → Supabase Auth (e-posta, OAuth vb.)
public.*            → Uygulama verisi + RLS
private.*           → Trigger fonksiyonları, visibility/permission helper'ları
storage.objects     → Avatar, post medyası, ekler
Edge Functions      → Post oluşturma, medya upload, bildirim outbox, pipeline iskelet
```

## Migration sırası

| Dosya | İçerik |
|-------|--------|
| `20260615000001_extensions_private.sql` | `private` şema, `citext`, temel helper'lar |
| `20260615000002_core_identity.sql` | Kimlik, profiller, ayarlar, signup trigger |
| `20260615000003_entities.sql` | Sayfalar, gruplar, üyelik helper'ları |
| `20260615000004_social_graph.sql` | Takip, engelleme |
| `20260615000005_posts_content.sql` | Postlar, medya, kanıt, link preview, pipeline |
| `20260615000006_engagement.sql` | Yorumlar, reaksiyonlar |
| `20260615000007_notifications.sql` | Bildirim altyapısı |
| `20260615000008_moderation_feed.sql` | Şikayet, moderasyon, feed seen |
| `20260615000009_rls.sql` | Row Level Security politikaları |
| `20260615000010_storage.sql` | Storage bucket politikaları |
| `20260616100001_feed_specialties.sql` | Feed: specialties, content_type, junction tablolar |
| `20260616100002_feed_quality_impressions.sql` | Feed: quality_score, feed_impressions, MQS |
| `20260616100003_feed_rls.sql` | Feed: RLS + can_view_post genişletme |
| `20260616100004_feed_triggers.sql` | Feed: specialty inherit + doğrulama |
| `20260617000001_communication_worker.sql` | Delivery worker, templates, claim RPC |
| `20260617000002_messaging.sql` | conversations, messages, can_message |
| `20260617000003_messaging_storage.sql` | message-media bucket policies |
| `20260617000004_rpc_grants.sql` | RPC execute grant sıkılaştırma |
| `20260618000001_supabase_layer_closure.sql` | Audit fixes: slug, repost_count, RLS, storage |
| `20260619000001_supabase_final_closure.sql` | Direct conversation uniqueness, conversations UPDATE RLS |
| `20260620000001_advices_closure.sql` | Pre-API hardening (advices.md) |

## Feed ranking (Supabase katmanı)

Detay: [feed-ranking.md](./feed-ranking.md)


### Kimlik ve ayarlar
- [platform_staff](./tables/platform_staff.md)
- [profiles](./tables/profiles.md)
- [professional_applications](./tables/professional_applications.md)
- [system_settings](./tables/system_settings.md)
- [user_settings](./tables/user_settings.md)

### Sayfa ve grup entity'leri
- [pages](./tables/pages.md)
- [page_members](./tables/page_members.md)
- [groups](./tables/groups.md)
- [group_members](./tables/group_members.md)

### Sosyal graph
- [follows](./tables/follows.md)
- [blocks](./tables/blocks.md)

### İçerik
- [posts](./tables/posts.md)
- [post_evidences](./tables/post_evidences.md)
- [media](./tables/media.md)
- [post_media](./tables/post_media.md)
- [link_previews](./tables/link_previews.md)
- [content_pipeline_runs](./tables/content_pipeline_runs.md)

### Etkileşim
- [comments](./tables/comments.md)
- [reactions](./tables/reactions.md)

### Bildirimler
- [notification_event_types](./tables/notification_event_types.md)
- [notifications](./tables/notifications.md)
- [user_notification_settings](./tables/user_notification_settings.md)
- [notification_deliveries](./tables/notification_deliveries.md)
- [user_devices](./tables/user_devices.md)

### Moderasyon ve feed
- [reports](./tables/reports.md)
- [moderation_actions](./tables/moderation_actions.md)
- [feed_seen_items](./tables/feed_seen_items.md)
- [feed_impressions](./tables/feed_impressions.md)

### Feed — uzmanlık ve ilgi
- [specialties](./tables/specialties.md)
- [post_specialties](./tables/post_specialties.md)
- [user_specialties](./tables/user_specialties.md)
- [group_specialties](./tables/group_specialties.md)
- [profile_specialties](./tables/profile_specialties.md)
- [user_specialty_weights](./tables/user_specialty_weights.md)

### Mesajlaşma
- [conversations](./tables/conversations.md)
- [conversation_participants](./tables/conversation_participants.md)
- [messages](./tables/messages.md)

### Communication
- [notification_templates](./tables/notification_templates.md)

## Edge Functions

Tam liste: [edge-functions/README.md](./edge-functions/README.md)

| Function | Dokümantasyon |
|----------|---------------|
| `communication-dispatch` | [edge-functions/communication-dispatch.md](./edge-functions/communication-dispatch.md) |
| `register-device` | [edge-functions/register-device.md](./edge-functions/register-device.md) |
| `media-upload-init` | [edge-functions/media-upload-init.md](./edge-functions/media-upload-init.md) |
| `media-finalize` | [edge-functions/media-finalize.md](./edge-functions/media-finalize.md) |
| `create-post` | [edge-functions/create-post.md](./edge-functions/create-post.md) |
| `link-preview` | [edge-functions/link-preview.md](./edge-functions/link-preview.md) |
| `create-comment` | [edge-functions/create-comment.md](./edge-functions/create-comment.md) |
| `toggle-reaction` | [edge-functions/toggle-reaction.md](./edge-functions/toggle-reaction.md) |
| `toggle-follow` | [edge-functions/toggle-follow.md](./edge-functions/toggle-follow.md) |
| `toggle-block` | [edge-functions/toggle-block.md](./edge-functions/toggle-block.md) |
| `manage-group-membership` | [edge-functions/manage-group-membership.md](./edge-functions/manage-group-membership.md) |
| `submit-professional-application` | [edge-functions/submit-professional-application.md](./edge-functions/submit-professional-application.md) |
| `get-or-create-conversation` | [edge-functions/get-or-create-conversation.md](./edge-functions/get-or-create-conversation.md) |
| `send-message` | [edge-functions/send-message.md](./edge-functions/send-message.md) |
| `mark-conversation-read` | [edge-functions/mark-conversation-read.md](./edge-functions/mark-conversation-read.md) |
| `edit-message` / `delete-message` | [edge-functions/edit-message.md](./edge-functions/edit-message.md) |
| `record-feed-impressions` | [edge-functions/record-feed-impressions.md](./edge-functions/record-feed-impressions.md) |
| `moderate-target` | [edge-functions/moderate-target.md](./edge-functions/moderate-target.md) |
| `review-professional-application` | [edge-functions/review-professional-application.md](./edge-functions/review-professional-application.md) |
| `submit-report` | [edge-functions/submit-report.md](./edge-functions/submit-report.md) |
| `emit-notification` | [edge-functions/emit-notification.md](./edge-functions/emit-notification.md) |
| `content-pipeline-collect` | [edge-functions/content-pipeline-collect.md](./edge-functions/content-pipeline-collect.md) |
| `health` | GET liveness probe |
| `leave-conversation` | Katılımcı ayrılma |
| `delete-account` | GDPR soft-delete + queued hard delete |
| `create-page` | Page profil + pages + owner member |
| `edit-post` | Post düzenleme + mention |

Paylaşılan modüller: [edge-functions/_shared.md](./edge-functions/_shared.md)

## İlgili dokümanlar

- [Mimari ve kimlik modeli](./architecture.md)
- [Enum ve tipler](./enums-and-types.md)
- [Veritabanı helper fonksiyonları](./database-helpers.md)
- [RLS özeti](./rls.md)
- [Storage](./storage.md)
- [Feed ranking](./feed-ranking.md)
