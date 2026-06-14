-- =============================================================================
-- Social Graph Faz 1 — 04: follows + blocks
-- =============================================================================

create table public.follows (
  follower_profile_id  uuid not null references public.profiles (id) on delete cascade,
  following_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at           timestamptz not null default now(),
  primary key (follower_profile_id, following_profile_id),
  constraint follows_no_self check (follower_profile_id <> following_profile_id)
);

create index follows_following_idx on public.follows (following_profile_id);

-- Only professional/page profiles can be followed
create or replace function private.validate_follow_target()
returns trigger language plpgsql as $$
declare v_kind public.account_kind;
begin
  select account_kind into v_kind from public.profiles where id = new.following_profile_id;
  if v_kind not in ('professional', 'page') then
    raise exception 'Only professional or page profiles can be followed';
  end if;
  return new;
end;
$$;

create trigger trg_follows_validate_target
  before insert on public.follows
  for each row execute function private.validate_follow_target();

create table public.blocks (
  blocker_profile_id uuid not null references public.profiles (id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at         timestamptz not null default now(),
  primary key (blocker_profile_id, blocked_profile_id),
  constraint blocks_no_self check (blocker_profile_id <> blocked_profile_id)
);

create index blocks_blocked_idx on public.blocks (blocked_profile_id);

-- Follower counter triggers
create or replace function private.follows_count_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_profile_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.following_profile_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_profile_id;
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.following_profile_id;
  end if;
  return null;
end;
$$;

create trigger trg_follows_count
  after insert or delete on public.follows
  for each row execute function private.follows_count_trg();
