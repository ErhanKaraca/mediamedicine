-- =============================================================================
-- Social Graph Faz 1 — 07: notifications + settings
-- =============================================================================

create table public.notification_event_types (
  code                text primary key,
  category            text not null check (category in ('social', 'system', 'marketing')),
  default_channels    jsonb not null default '["in_app"]'::jsonb,
  user_configurable     boolean not null default true,
  description         text
);

insert into public.notification_event_types (code, category, default_channels, description) values
  ('like', 'social', '["in_app", "push"]', 'Someone liked your post'),
  ('comment', 'social', '["in_app", "push"]', 'New comment on your post'),
  ('follow', 'social', '["in_app", "push"]', 'New follower'),
  ('repost', 'social', '["in_app", "push"]', 'Your post was reposted'),
  ('mention', 'social', '["in_app", "push"]', 'You were mentioned'),
  ('group_join_request', 'social', '["in_app"]', 'Group join request'),
  ('group_join_approved', 'social', '["in_app", "push"]', 'Group join approved'),
  ('message', 'social', '["in_app", "push", "email"]', 'New direct message'),
  ('moderation_action', 'system', '["in_app", "email"]', 'Moderation action taken'),
  ('professional_application', 'system', '["in_app", "email"]', 'Professional application update')
on conflict (code) do nothing;

create table public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  recipient_user_id     uuid not null references auth.users (id) on delete cascade,
  recipient_profile_id  uuid references public.profiles (id) on delete set null,
  actor_profile_id      uuid references public.profiles (id) on delete set null,
  event_type            text not null references public.notification_event_types (code),
  entity_type           text,
  entity_id             uuid,
  title                 text not null,
  body                  text,
  payload               jsonb not null default '{}'::jsonb,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_user_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_user_id) where read_at is null;

create table public.user_notification_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  profile_id   uuid references public.profiles (id) on delete cascade,
  event_type   text not null references public.notification_event_types (code),
  channel      text not null check (channel in (
    'in_app', 'realtime', 'push', 'email', 'sms', 'telegram', 'slack', 'whatsapp'
  )),
  enabled      boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (user_id, profile_id, event_type, channel)
);

create index user_notif_settings_user_idx on public.user_notification_settings (user_id);

create table public.notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  notification_id     uuid not null references public.notifications (id) on delete cascade,
  channel             text not null,
  status              text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  skip_reason         text,
  provider_message_id text,
  error               text,
  attempts            integer not null default 0,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index notification_deliveries_pending_idx on public.notification_deliveries (status)
  where status = 'pending';

create table public.user_devices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  platform    text not null check (platform in ('ios', 'android', 'web')),
  push_token  text not null,
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (user_id, platform, push_token)
);

-- Resolve whether a channel should fire (used by emit-notification edge function)
create or replace function private.should_notify_channel(
  p_user_id uuid,
  p_profile_id uuid,
  p_event_type text,
  p_channel text
)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (
      select uns.enabled from public.user_notification_settings uns
      where uns.user_id = p_user_id
        and (uns.profile_id is not distinct from p_profile_id)
        and uns.event_type = p_event_type
        and uns.channel = p_channel
      limit 1
    ),
    (
      select (net.default_channels ? p_channel)
      from public.notification_event_types net
      where net.code = p_event_type
    ),
    true
  );
$$;
