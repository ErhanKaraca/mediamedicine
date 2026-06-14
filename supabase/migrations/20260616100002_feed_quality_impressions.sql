-- =============================================================================
-- Feed v2 — 02: quality_score, feed_impressions, MQS helper, feed indexes
-- =============================================================================

alter table public.posts
  add column quality_score integer check (quality_score is null or (quality_score >= 0 and quality_score <= 100));

create type public.feed_impression_event as enum ('impression', 'click', 'dwell', 'dismiss');
create type public.feed_surface as enum ('home', 'group', 'profile');

create table public.feed_impressions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  post_id      uuid not null references public.posts (id) on delete cascade,
  event_type   public.feed_impression_event not null,
  dwell_ms     integer check (dwell_ms is null or dwell_ms >= 0),
  feed_surface public.feed_surface not null default 'home',
  created_at   timestamptz not null default now()
);

create index feed_impressions_profile_created_idx
  on public.feed_impressions (profile_id, created_at desc);

create index feed_impressions_post_idx on public.feed_impressions (post_id);

-- Feed query indexes
create index posts_content_type_published_idx
  on public.posts (content_type, published_at desc)
  where deleted_at is null and status = 'published' and moderation_state = 'none';

create index posts_quality_published_idx
  on public.posts (quality_score desc nulls last, published_at desc)
  where deleted_at is null and status = 'published' and moderation_state = 'none';

-- Medical Quality Score (MQS) — computed from evidences + author trust
create or replace function private.compute_post_quality_score(p_post_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_score integer := 0;
  v_kind public.account_kind;
  v_verified boolean;
begin
  select pr.account_kind, pr.is_verified into v_kind, v_verified
  from public.posts po
  join public.profiles pr on pr.id = po.author_profile_id
  where po.id = p_post_id;

  if not found then return 0; end if;

  if exists (
    select 1 from public.post_evidences
    where post_id = p_post_id and source_type = 'clinical_guideline'
  ) then
    v_score := v_score + 40;
  end if;

  if exists (
    select 1 from public.post_evidences
    where post_id = p_post_id
      and identifier_type in ('doi', 'pmid', 'pmcid')
  ) then
    v_score := v_score + 30;
  end if;

  if exists (select 1 from public.post_evidences where post_id = p_post_id) then
    v_score := v_score + 15;
  end if;

  if v_verified then v_score := v_score + 10; end if;

  if v_kind = 'professional' and v_verified then
    v_score := v_score + 5;
  elsif v_kind = 'professional' then
    v_score := v_score + 3;
  elsif v_kind = 'page' then
    v_score := v_score + 4;
  else
    v_score := v_score + 1;
  end if;

  return least(v_score, 100);
end;
$$;

create or replace function private.post_quality_score_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_post_id uuid;
begin
  v_post_id := coalesce(new.post_id, old.post_id);
  update public.posts
  set quality_score = private.compute_post_quality_score(v_post_id)
  where id = v_post_id;
  return null;
end;
$$;

create trigger trg_post_evidences_quality
  after insert or update or delete on public.post_evidences
  for each row execute function private.post_quality_score_trg();
