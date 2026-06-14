# Enum ve Tipler

Postgres enum'ları `public` şemasında tanımlıdır. Edge Functions tarafında TypeScript sabitleri `supabase/functions/_shared/config.ts` içinde yansıtılır.

## Kimlik

### `account_kind`
Profil türü (`profiles.account_kind`). **Platform staff burada yoktur** — operasyonel yetki `platform_staff` tablosunda tutulur; personel tipik olarak `user` (veya onay sonrası `professional`) profiline sahiptir.

| Değer | Açıklama |
|-------|----------|
| `user` | Standart kullanıcı, duvar yok |
| `professional` | Onaylı profesyonel hesap, duvar var |
| `page` | Kurum/marka sayfası profili |

### `application_status`
Profesyonel başvuru durumu.

| Değer | Açıklama |
|-------|----------|
| `pending` | İnceleme bekliyor |
| `approved` | Onaylandı |
| `rejected` | Reddedildi |

## Sayfa ve grup

### `page_visibility`
| Değer | Açıklama |
|-------|----------|
| `public` | Herkese açık sayfa |
| `private` | Kısıtlı sayfa |

### `group_visibility`
| Değer | Açıklama |
|-------|----------|
| `public` | Keşfedilebilir |
| `private` | Davet/istek ile |
| `secret` | Listelenmez |

### `group_join_policy`
| Değer | Açıklama |
|-------|----------|
| `open` | Doğrudan katılım |
| `request` | Onay gerekir |
| `invite_only` | Yalnızca davet |

### `member_role`
Sayfa/grup üyelik rolü.

| Değer | Açıklama |
|-------|----------|
| `owner` | Sahip |
| `admin` | Yönetici |
| `moderator` | Moderatör |
| `member` | Üye |
| `editor` | İçerik editörü (sayfa postları için) |

### `member_status`
| Değer | Açıklama |
|-------|----------|
| `active` | Aktif üye |
| `pending` | Onay bekliyor |
| `banned` | Yasaklı |
| `left` | Ayrıldı |

## Post ve içerik

### `post_type`
| Değer | Açıklama |
|-------|----------|
| `standard` | Normal post |
| `quote` | Alıntılı paylaşım |
| `repost` | Yeniden paylaşım |

### `content_type` (feed v2)
İçerik türü — `post_type`'tan bağımsız.

| Değer | Açıklama |
|-------|----------|
| `case_study` | Vaka sunumu |
| `research_summary` | Araştırma özeti |
| `clinical_question` | Klinik soru |
| `discussion` | Tartışma (varsayılan) |
| `guideline_update` | Kılavuz güncellemesi |
| `drug_update` | İlaç güncellemesi |
| `patient_education` | Hasta eğitimi |
| `conference_summary` | Kongre özeti |

### `specialty_source`
| Değer | Açıklama |
|-------|----------|
| `onboarding` | Kayıt/onboarding seçimi |
| `manual` | Kullanıcı ayarları |
| `inferred` | Sistem çıkarımı |

### `feed_impression_event` / `feed_surface`
Feed etkileşim olayları: impression, click, dwell, dismiss — yüzeyler: home, group, profile.

### `post_lifecycle`
Post ve yorum yaşam döngüsü.

| Değer | Açıklama |
|-------|----------|
| `draft` | Taslak |
| `scheduled` | Zamanlanmış |
| `publishing` | Yayınlanıyor |
| `published` | Yayında |
| `archived` | Arşivlendi |
| `deleted` | Silindi |

### `moderation_state`
| Değer | Açıklama |
|-------|----------|
| `none` | Moderasyon yok |
| `pending_review` | İnceleme kuyruğunda |
| `flagged` | İşaretlendi |
| `under_review` | İnceleniyor |
| `hidden` | Gizlendi |
| `removed` | Kaldırıldı |
| `rejected` | Reddedildi |

### `processing_state`
Medya/pipeline işleme durumu.

| Değer | Açıklama |
|-------|----------|
| `none` | İşlem yok |
| `media_pending` | Medya bekleniyor |
| `pipeline_queued` | Pipeline kuyruğunda |
| `pipeline_processing` | İşleniyor |
| `pipeline_failed` | Başarısız |

### `post_visibility`
| Değer | Açıklama |
|-------|----------|
| `public` | Herkese açık |
| `followers` | Takipçilere |
| `page_followers` | Sayfa takipçilerine |
| `professionals_only` | Yalnızca profesyonellere |
| `group_only` | Grup üyelerine |
| `members_only` | Üyelere (sayfa bağlamı) |
| `unlisted` | Link ile erişim |
| `private` | Yalnızca yazar |

### `reply_policy`
Yorum kimler yazabilir.

| Değer | Açıklama |
|-------|----------|
| `everyone` | Herkes |
| `followers` | Takipçiler |
| `members` | Üyeler |
| `mentioned` | Bahsedilenler |
| `none` | Kapalı |

## Medya

### `media_kind`
| Değer | Açıklama |
|-------|----------|
| `image` | Görsel |
| `video` | Video |
| `document` | Ek dosya (PDF, doc vb.) |

### `media_status`
| Değer | Açıklama |
|-------|----------|
| `pending` | Upload bekleniyor |
| `processing` | Transcode/optimizasyon |
| `ready` | Kullanıma hazır |
| `failed` | Hata |

## Kanıt (evidence)

### `evidence_source_type`
| Değer | Açıklama |
|-------|----------|
| `publication` | Bilimsel yayın |
| `clinical_guideline` | Klinik kılavuz |
| `book` | Kitap |
| `news_article` | Haber |
| `external_url` | Harici URL |
| `media_asset` | Medya varlığı |
| `own_experience` | Kişisel deneyim |
| `own_opinion` | Görüş |
| `other` | Diğer |

### `evidence_identifier_type`
| Değer | Açıklama |
|-------|----------|
| `doi`, `pmid`, `pmcid` | Tıbbi yayın ID'leri |
| `isbn`, `issn` | Kitap/dergi |
| `nct`, `eudract` | Klinik çalışma |
| `url`, `custom` | Genel |

## Sabit limitler (Edge `_shared/config.ts`)

| Sabit | Değer |
|-------|-------|
| `POST_BODY_MAX_CHARS` | 2000 |
| `COMMENT_MAX_DEPTH` | 3 |
| `POST_MEDIA.maxSlots` | 4 |
| `POST_MEDIA.maxVideos` | 1 |
| `POST_ATTACHMENTS.max` | 3 |
| `MAX_EVIDENCES_PER_POST` | 20 |
