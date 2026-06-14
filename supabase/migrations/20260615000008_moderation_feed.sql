-- =============================================================================
-- Social Graph Faz 1 — 08: moderation + feed seen items
-- =============================================================================

create table public.reports (
  id                   uuid primary key default gen_random_uuid(),
  reporter_profile_id  uuid not null references public.profiles (id) on delete cascade,
  target_type          text not null check (target_type in ('post', 'comment', 'profile', 'message')),
  target_id            uuid not null,
  reason_code          text not null,
  details              text,
  status               text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at           timestamptz not null default now(),
  resolved_at          timestamptz,
  resolved_by          uuid references auth.users (id) on delete set null
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_target_idx on public.reports (target_type, target_id);

create table public.moderation_actions (
  id                uuid primary key default gen_random_uuid(),
  moderator_user_id uuid not null references auth.users (id) on delete restrict,
  target_type       text not null,
  target_id         uuid not null,
  action            text not null check (action in ('hide', 'remove', 'warn', 'ban', 'restore')),
  reason            text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id);

-- Feed dedup skeleton (ranking algorithm is a separate plan)
create table public.feed_seen_items (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  post_id     uuid not null references public.posts (id) on delete cascade,
  seen_at     timestamptz not null default now(),
  primary key (profile_id, post_id)
);

create index feed_seen_at_idx on public.feed_seen_items (profile_id, seen_at desc);

-- Block check helper
create or replace function private.is_blocked(p_viewer_profile_id uuid, p_target_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_profile_id = p_viewer_profile_id and b.blocked_profile_id = p_target_profile_id)
       or (b.blocker_profile_id = p_target_profile_id and b.blocked_profile_id = p_viewer_profile_id)
  );
$$;

-- Simplified post visibility check (v1 — feed algorithm plan will extend)
create or replace function private.can_view_post(p_post_id uuid, p_viewer_profile_id uuid default null)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  p record;
  v_viewer_user uuid;
begin
  select * into p from public.posts where id = p_post_id;
  if not found or p.deleted_at is not null or p.status <> 'published'
     or p.moderation_state not in ('none') then
    return false;
  end if;

  if p.visibility = 'public' and p.group_id is null then return true; end if;
  if p_viewer_profile_id is null then return p.visibility = 'public' and p.group_id is null; end if;

  if private.is_blocked(p_viewer_profile_id, p.author_profile_id) then return false; end if;

  select owner_user_id into v_viewer_user from public.profiles where id = p_viewer_profile_id;

  if p.author_profile_id = p_viewer_profile_id then return true; end if;
  if p.actor_user_id = v_viewer_user then return true; end if;

  if p.visibility = 'public' then return true; end if;

  if p.visibility = 'followers' and exists (
    select 1 from public.follows f
    where f.follower_profile_id = p_viewer_profile_id
      and f.following_profile_id = p.author_profile_id
  ) then return true; end if;

  if p.visibility = 'group_only' and p.group_id is not null
     and private.is_group_member(p.group_id, p_viewer_profile_id) then
    return true;
  end if;

  return false;
end;
$$;
