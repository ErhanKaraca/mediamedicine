-- =============================================================================
-- Social Graph Faz 1 — 03: pages + groups (groups separate from profiles)
-- =============================================================================

create type public.page_visibility as enum ('public', 'private');
create type public.group_visibility as enum ('public', 'private', 'secret');
create type public.group_join_policy as enum ('open', 'request', 'invite_only');
create type public.member_role as enum ('owner', 'admin', 'moderator', 'member', 'editor');
create type public.member_status as enum ('active', 'pending', 'banned', 'left');

create table public.pages (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null unique references public.profiles (id) on delete cascade,
  created_by_user_id  uuid not null references auth.users (id) on delete restrict,
  visibility          public.page_visibility not null default 'public',
  settings            jsonb not null default '{}'::jsonb,
  member_count        integer not null default 0 check (member_count >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_pages_updated_at
  before update on public.pages
  for each row execute function private.set_updated_at();

create table public.page_members (
  page_id     uuid not null references public.pages (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null default 'member',
  status      public.member_status not null default 'active',
  created_at  timestamptz not null default now(),
  primary key (page_id, profile_id)
);

create index page_members_profile_idx on public.page_members (profile_id);

-- Groups: standalone entity (NOT profiles)
create table public.groups (
  id                    uuid primary key default gen_random_uuid(),
  slug                  extensions.citext not null unique,
  name                  text not null,
  description           text,
  avatar_url            text,
  banner_url            text,
  visibility            public.group_visibility not null default 'public',
  join_policy           public.group_join_policy not null default 'open',
  rules                 jsonb not null default '{}'::jsonb,
  settings              jsonb not null default '{}'::jsonb,
  member_count          integer not null default 0 check (member_count >= 0),
  post_count            integer not null default 0 check (post_count >= 0),
  created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint groups_slug_len check (char_length(slug::text) between 3 and 50),
  constraint groups_slug_format check (slug ~ '^[a-zA-Z0-9_-]+$')
);

create trigger trg_groups_updated_at
  before update on public.groups
  for each row execute function private.set_updated_at();

create table public.group_members (
  group_id      uuid not null references public.groups (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  role          public.member_role not null default 'member',
  status        public.member_status not null default 'active',
  banned_until  timestamptz,
  banned_reason text,
  created_at    timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create index group_members_profile_idx on public.group_members (profile_id);
create index group_members_status_idx on public.group_members (group_id, status);

-- Permission helpers
create or replace function private.is_page_member(p_page_id uuid, p_profile_id uuid, p_roles text[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.page_members pm
    where pm.page_id = p_page_id
      and pm.profile_id = p_profile_id
      and pm.status = 'active'
      and (p_roles is null or pm.role::text = any(p_roles))
  );
$$;

create or replace function private.is_group_member(p_group_id uuid, p_profile_id uuid, p_active_only boolean default true)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.profile_id = p_profile_id
      and (not p_active_only or gm.status = 'active')
  );
$$;

create or replace function private.can_post_as(p_author_profile_id uuid, p_actor_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_author_profile_id
      and p.deleted_at is null
      and (
        (p.account_kind in ('user', 'professional') and p.owner_user_id = p_actor_user_id)
        or (
          p.account_kind = 'page'
          and exists (
            select 1 from public.pages pg
            join public.page_members pm on pm.page_id = pg.id
            join public.profiles actor on actor.id = pm.profile_id
            where pg.profile_id = p_author_profile_id
              and actor.owner_user_id = p_actor_user_id
              and pm.status = 'active'
              and pm.role in ('owner', 'admin', 'editor')
          )
        )
      )
  );
$$;
