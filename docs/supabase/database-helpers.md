# Veritabanı Yardımcı Fonksiyonları

`private` şemasında tanımlı fonksiyonlar. Doğrudan istemci tarafından çağrılmaz; trigger'lar, RLS politikaları ve Edge Functions tarafından kullanılır.

## Genel

### `private.set_updated_at()`
**Tür:** Trigger fonksiyonu  
**Kullanım:** `BEFORE UPDATE` — `updated_at` kolonunu `now()` ile günceller.  
**Tablolar:** `profiles`, `pages`, `groups`, `posts`, `comments`, `content_pipeline_runs`

### `private.current_user_id()`
**Tür:** SQL stable  
**Dönüş:** `auth.uid()` — oturum açmış kullanıcının UUID'si.

## Kimlik

### `private.handle_new_user()`
**Tür:** Trigger (`AFTER INSERT ON auth.users`)  
**Ne yapar:** Yeni kayıt olan kullanıcı için otomatik `profiles` (account_kind=`user`) ve `user_settings` satırı oluşturur. Slug: `raw_user_meta_data.username` veya `user_<id_prefix>`. Slug çakışmasında suffix retry (max 5), son çare `on conflict do nothing`.

### `private.is_platform_staff(user_id, permission?)`
**Dönüş:** boolean  
Aktif platform personeli mi? İsteğe bağlı `permission` dizide var mı kontrol eder. `super_admin` veya `moderator` / `content_ops` / `support` rolleri permission olmadan geçer.

`profiles` ile ilişkisi yoktur — aynı `user_id` hem staff hem user/professional profiline sahip olabilir.

### `private.get_personal_profile_id(user_id)`
**Dönüş:** uuid  
Kullanıcının kişisel profil ID'si. Professional varsa onu, yoksa user profilini döner.

## Yetkilendirme

### `private.can_post_as(author_profile_id, actor_user_id)`
**Dönüş:** boolean  
Actor, author profili adına post/yorum yazabilir mi?

- User/professional → `owner_user_id` eşleşmeli
- Page → actor, `page_members`'da owner/admin/editor olmalı

### `private.is_page_member(page_id, profile_id, roles?)`
**Dönüş:** boolean  
Profil aktif sayfa üyesi mi? İsteğe bağlı rol filtresi.

### `private.is_group_member(group_id, profile_id, active_only?)`
**Dönüş:** boolean  
Profil grup üyesi mi? Varsayılan: yalnızca `status = 'active'`.

## Sosyal graph

### `private.validate_follow_target()`
**Tür:** Trigger (`BEFORE INSERT ON follows`)  
Yalnızca `professional` veya `page` profilleri takip edilebilir.

### `private.follows_count_trg()`
**Tür:** Trigger (`AFTER INSERT/DELETE ON follows`)  
`profiles.follower_count` ve `profiles.following_count` günceller.

## İçerik

### `private.validate_post_placement()`
**Tür:** Trigger (`BEFORE INSERT/UPDATE ON posts`)  
Post yerleşim kurallarını doğrular (user→grup zorunluluğu, üyelik, page context).

### `private.posts_count_trg()`
**Tür:** Trigger  
Yayınlanan post sayısını `profiles.post_count` ve `groups.post_count` üzerinde tutar.

### `private.comments_depth_trg()`
**Tür:** Trigger (`BEFORE INSERT ON comments`)  
Thread derinliğini hesaplar; max 3 seviye.

### `private.comments_count_trg()` / `private.reactions_count_trg()`
Post üzerindeki `comment_count` ve `reaction_count` denormalize sayaçlarını günceller.

### `private.repost_count_trg()`
**Tür:** Trigger (`AFTER INSERT/UPDATE/DELETE ON posts`)  
Repost yayınlandığında `quote_of_id` postunun `repost_count` değerini artırır; soft-delete veya silmede azaltır.

## Görünürlük

### `private.is_blocked(viewer_profile_id, target_profile_id)`
**Dönüş:** boolean  
İki profil arasında (herhangi yönde) engelleme var mı?

### `private.can_view_post(post_id, viewer_profile_id?)`
**Dönüş:** boolean  
v1 visibility kontrolü: public, followers, group_only, engelleme, yazar/actor istisnaları.

### `private.can_read_storage_object(bucket, path, user_id)`
**Dönüş:** boolean  
Storage SELECT policy helper — post/message medyası için visibility ve konuşma katılımcılığı kontrolü. `avatars` bucket'ı bu fonksiyonu kullanmaz (public read policy).

## Bildirim

### `private.should_notify_channel(user_id, profile_id, event_type, channel)`
**Dönüş:** boolean  
Kullanıcı ayarı → event type varsayılanı → true fallback sırasıyla kanal açık mı?

## Feed (v2)

### `private.compute_post_quality_score(post_id)`
**Dönüş:** integer 0–100  
MedicalQualityScore — evidence + author trust tier.

### `private.inherit_group_specialties(post_id, group_id)`
Grup specialty'lerini post'a kopyalar.

### `private.validate_post_specialties()`
Deferrable trigger: pro/page postlarında min 1 specialty.

### `private.can_message(from, to)`
Mesajlaşma uygunluğu — user→pro/page; pro/page→pro/page; block filtresi.

### `public.claim_pending_notification_deliveries(batch, worker_id)`
Communication worker — pending delivery claim + lock.

### `public.should_notify_channel(...)`
Public wrapper — edge router ayar kontrolü.

### `public.get_or_create_direct_conversation(a, b)`
Atomik direct conversation oluşturma — race-safe. `direct_conversation_pairs` unique constraint.

### `public.find_direct_conversation(a, b)` / `public.can_message(...)`
Messaging RPC wrappers.
