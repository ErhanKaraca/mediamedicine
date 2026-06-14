-- =============================================================================
-- Social Graph Faz 1 — 02: core identity (platform, profiles, settings)
-- =============================================================================

create type public.account_kind as enum ('user', 'professional', 'page');
create type public.application_status as enum ('pending', 'approved', 'rejected');

-- Platform staff (no public profile wall)
create table public.platform_staff (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  role          text not null check (role in ('super_admin', 'moderator', 'support', 'content_ops')),
  permissions   text[] not null default '{}',
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_at    timestamptz not null default now()
);

-- Universal profile shell (user / professional / page — NOT groups)
create table public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid references auth.users (id) on delete set null,
  account_kind        public.account_kind not null default 'user',
  slug                extensions.citext not null unique,
  display_name        text,
  bio                 text,
  avatar_url          text,
  banner_url          text,
  visibility_settings jsonb not null default '{}'::jsonb,
  follower_count      integer not null default 0 check (follower_count >= 0),
  following_count     integer not null default 0 check (following_count >= 0),
  post_count          integer not null default 0 check (post_count >= 0),
  is_verified         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  constraint profiles_slug_len check (char_length(slug::text) between 3 and 40),
  constraint profiles_slug_format check (slug ~ '^[a-zA-Z0-9_-]+$'),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 500),
  constraint profiles_page_no_owner check (
    account_kind <> 'page' or owner_user_id is null
  )
);

create index profiles_owner_idx on public.profiles (owner_user_id) where deleted_at is null;
create index profiles_kind_idx on public.profiles (account_kind) where deleted_at is null;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Professional upgrade workflow (admin approval required)
create table public.professional_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  status        public.application_status not null default 'pending',
  notes         text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users (id) on delete set null
);

create index professional_applications_user_idx on public.professional_applications (user_id, status);

-- System-wide settings (staff-managed runtime overrides)
create table public.system_settings (
  key          text primary key,
  value        jsonb not null,
  description  text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users (id) on delete set null
);

-- Per-user preferences
create table public.user_settings (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  locale       text default 'tr',
  timezone     text default 'Europe/Istanbul',
  preferences  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Auto-create user profile + settings on signup
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_slug text;
begin
  v_slug := coalesce(
    new.raw_user_meta_data ->> 'username',
    'user_' || replace(substr(new.id::text, 1, 8), '-', '')
  );

  insert into public.profiles (owner_user_id, account_kind, slug, display_name, avatar_url)
  values (
    new.id,
    'user',
    v_slug,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (slug) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Seed default system settings
insert into public.system_settings (key, value, description) values
  ('notifications.defaults', '{"push": true, "email": true, "in_app": true}'::jsonb, 'Default notification channels for new users'),
  ('feed.public_anon_enabled', 'true'::jsonb, 'Allow anonymous users to read public feed'),
  ('professional.application_auto_reject_days', '30'::jsonb, 'Auto-reject pending applications after N days')
on conflict (key) do nothing;

-- Profile-dependent helpers (require tables above)
create or replace function private.is_platform_staff(p_user_id uuid, p_permission text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_staff ps
    where ps.user_id = p_user_id
      and ps.status = 'active'
      and (p_permission is null or p_permission = any(ps.permissions))
  );
$$;

create or replace function private.get_personal_profile_id(p_user_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles
  where owner_user_id = p_user_id
    and account_kind in ('user', 'professional')
    and deleted_at is null
  order by case account_kind when 'professional' then 0 else 1 end
  limit 1;
$$;
