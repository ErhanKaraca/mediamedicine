-- =============================================================================
-- Advices closure — pre-API hardening (advices.md)
-- =============================================================================

-- 4.1 Stale delivery lock recovery
create or replace function public.claim_pending_notification_deliveries(
  p_batch_size integer default 50,
  p_worker_id text default 'communication-dispatch'
)
returns setof public.notification_deliveries
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select nd.id
    from public.notification_deliveries nd
    where nd.status = 'pending'
      and (nd.locked_at is null or nd.locked_at < now() - interval '10 minutes')
      and (nd.next_retry_at is null or nd.next_retry_at <= now())
      and nd.attempts < nd.max_attempts
    order by nd.created_at
    limit p_batch_size
    for update skip locked
  ),
  claimed as (
    update public.notification_deliveries nd
    set
      locked_at = now(),
      locked_by = p_worker_id,
      attempts = nd.attempts + 1
    from candidates c
    where nd.id = c.id
    returning nd.*
  )
  select * from claimed;
end;
$$;

-- 1.7 system_settings — whitelist public keys; staff reads all
drop policy if exists system_settings_read on public.system_settings;

create policy system_settings_public_read on public.system_settings
  for select to authenticated
  using (
    key in (
      'notifications.defaults',
      'feed.public_anon_enabled'
    )
  );

create policy system_settings_staff_read on public.system_settings
  for select to authenticated
  using (private.is_platform_staff((select auth.uid())));

-- 4.4 MQS trigger — deferrable (one recompute per transaction)
drop trigger if exists trg_post_evidences_quality on public.post_evidences;

create constraint trigger trg_post_evidences_quality
  after insert or update or delete on public.post_evidences
  deferrable initially deferred
  for each row execute function private.post_quality_score_trg();

-- 1.1 Message media junction (mirrors post_media)
create table public.message_media (
  message_id  uuid not null references public.messages (id) on delete cascade,
  media_id    uuid not null references public.media (id) on delete cascade,
  position    smallint not null default 0 check (position >= 0),
  primary key (message_id, media_id)
);

create index message_media_media_idx on public.message_media (media_id);

alter table public.message_media enable row level security;

create policy message_media_select on public.message_media for select to authenticated
  using (
    exists (
      select 1 from public.messages msg
      join public.conversation_participants cp on cp.conversation_id = msg.conversation_id
      join public.profiles p on p.id = cp.profile_id
      where msg.id = message_media.message_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- 1.2 Storage read — FK join instead of JSONB LIKE
create or replace function private.can_read_storage_object(
  p_bucket text,
  p_path text,
  p_user_id uuid
)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_viewer_profile uuid;
  v_folder text;
begin
  if p_user_id is null then
    return false;
  end if;

  v_viewer_profile := private.get_personal_profile_id(p_user_id);
  v_folder := split_part(p_path, '/', 1);

  if p_bucket in ('post-media', 'post-attachments') then
    if exists (
      select 1 from public.profiles p
      where p.owner_user_id = p_user_id and p.id::text = v_folder
    ) then
      return true;
    end if;

    return exists (
      select 1 from public.media m
      join public.post_media pm on pm.media_id = m.id
      where m.bucket = p_bucket
        and m.storage_path = p_path
        and private.can_view_post(pm.post_id, v_viewer_profile)
    );
  end if;

  if p_bucket = 'message-media' then
    if exists (
      select 1 from public.profiles p
      where p.owner_user_id = p_user_id and p.id::text = v_folder
    ) then
      return true;
    end if;

    return exists (
      select 1 from public.media m
      join public.message_media mm on mm.media_id = m.id
      join public.messages msg on msg.id = mm.message_id and msg.deleted_at is null
      join public.conversation_participants cp on cp.conversation_id = msg.conversation_id
      join public.profiles vp on vp.id = cp.profile_id and vp.owner_user_id = p_user_id
      where m.bucket = 'message-media'
        and m.storage_path = p_path
    );
  end if;

  return false;
end;
$$;

-- 1.4 Audit snapshots
alter table public.reports
  add column if not exists target_snapshot jsonb not null default '{}'::jsonb;

alter table public.moderation_actions
  add column if not exists target_snapshot jsonb not null default '{}'::jsonb;

-- 5.2 Impression dedup (impression + click: one per profile/post)
create unique index if not exists feed_impressions_dedup_impression
  on public.feed_impressions (profile_id, post_id)
  where event_type = 'impression';

create unique index if not exists feed_impressions_dedup_click
  on public.feed_impressions (profile_id, post_id)
  where event_type = 'click';

-- 5.1 Feed score (MQS + time decay)
alter table public.posts
  add column if not exists feed_score numeric;

create or replace function private.compute_feed_score(
  p_quality_score integer,
  p_published_at timestamptz
)
returns numeric language sql immutable parallel safe set search_path = '' as $$
  select round(
    coalesce(p_quality_score, 0)::numeric
    * exp(-0.1 * extract(epoch from (now() - coalesce(p_published_at, now()))) / 86400.0),
    4
  );
$$;

create or replace function private.post_feed_score_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.feed_score := private.compute_feed_score(new.quality_score, new.published_at);
  return new;
end;
$$;

drop trigger if exists trg_posts_feed_score on public.posts;
create trigger trg_posts_feed_score
  before insert or update of quality_score, published_at on public.posts
  for each row execute function private.post_feed_score_trg();

update public.posts
set feed_score = private.compute_feed_score(quality_score, published_at)
where deleted_at is null and status = 'published';

-- 5.3 Feed query RPC (v1 — specialty-aware home feed skeleton)
create or replace function public.get_feed_posts(
  p_viewer_profile_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.posts
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.posts p
  where p.deleted_at is null
    and p.status = 'published'
    and p.moderation_state = 'none'
    and private.can_view_post(p.id, p_viewer_profile_id)
    and not exists (
      select 1 from public.feed_seen_items fsi
      where fsi.profile_id = p_viewer_profile_id and fsi.post_id = p.id
    )
  order by p.feed_score desc nulls last, p.published_at desc nulls last
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.get_feed_posts(uuid, integer, integer) from public;
grant execute on function public.get_feed_posts(uuid, integer, integer) to authenticated, service_role;

-- 3.3 Leave conversation — participant delete policy
create policy conversation_participants_delete on public.conversation_participants
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = conversation_participants.profile_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- 2.1 Idempotency store (API will extend; edge writes use service role)
create table public.idempotency_keys (
  key           text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  resource_type text not null,
  response      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '24 hours')
);

create index idempotency_keys_expires_idx on public.idempotency_keys (expires_at);

alter table public.idempotency_keys enable row level security;

-- 6.3 Admin audit log
create table public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users (id) on delete restrict,
  action        text not null,
  target_type   text,
  target_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index admin_audit_log_actor_idx on public.admin_audit_log (actor_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;

create policy admin_audit_log_staff_select on public.admin_audit_log
  for select to authenticated
  using (private.is_platform_staff((select auth.uid())));

-- 4.3 Cache contact email in user_settings at signup
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_slug text;
  v_attempt integer := 0;
  v_inserted boolean := false;
begin
  v_slug := coalesce(
    new.raw_user_meta_data ->> 'username',
    'user_' || replace(substr(new.id::text, 1, 8), '-', '')
  );

  while v_attempt < 5 and not v_inserted loop
    begin
      insert into public.profiles (owner_user_id, account_kind, slug, display_name, avatar_url)
      values (
        new.id,
        'user',
        v_slug,
        coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
        new.raw_user_meta_data ->> 'avatar_url'
      );
      v_inserted := true;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      v_slug := coalesce(new.raw_user_meta_data ->> 'username', 'user')
        || '_' || substr(replace(new.id::text, '-', ''), 1, 6 + v_attempt);
    end;
  end loop;

  if not v_inserted then
    insert into public.profiles (owner_user_id, account_kind, slug, display_name, avatar_url)
    values (
      new.id,
      'user',
      'user_' || replace(new.id::text, '-', ''),
      coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (slug) do nothing;
  end if;

  insert into public.user_settings (user_id, preferences)
  values (
    new.id,
    jsonb_build_object('contact_email', new.email)
  )
  on conflict (user_id) do update
  set preferences = public.user_settings.preferences
    || jsonb_build_object('contact_email', excluded.preferences -> 'contact_email');

  return new;
end;
$$;

-- Document group_dm as reserved (1.6 — enum kept, unimplemented)
comment on type public.conversation_type is 'direct: 1:1 messaging. group_dm: reserved Faz 2+, not yet implemented.';

-- Extend content_pipeline_runs for audit/deletion jobs
alter table public.content_pipeline_runs drop constraint if exists content_pipeline_runs_resource_type_check;
alter table public.content_pipeline_runs add constraint content_pipeline_runs_resource_type_check
  check (resource_type in ('post', 'media', 'comment', 'notification_failure', 'account_deletion'));

alter table public.content_pipeline_runs drop constraint if exists content_pipeline_runs_status_check;
alter table public.content_pipeline_runs add constraint content_pipeline_runs_status_check
  check (status in ('context_recorded', 'processing', 'done', 'failed', 'queued'));
