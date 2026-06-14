-- =============================================================================
-- Communication worker — delivery locking, templates, system settings
-- =============================================================================

alter table public.notification_deliveries
  add column if not exists next_retry_at timestamptz,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text,
  add column if not exists max_attempts integer not null default 5;

create index if not exists notification_deliveries_dispatch_idx
  on public.notification_deliveries (status, next_retry_at nulls first, created_at)
  where status = 'pending';

create table public.notification_templates (
  key              text not null,
  channel          text not null,
  locale           text not null default 'tr',
  subject_template text,
  body_template    text not null,
  created_at       timestamptz not null default now(),
  primary key (key, channel, locale)
);

insert into public.notification_templates (key, channel, locale, subject_template, body_template) values
  ('like', 'email', 'tr', 'Yeni beğeni', '{{actorName}} gönderinizi beğendi'),
  ('comment', 'email', 'tr', 'Yeni yorum', '{{actorName}} gönderinize yorum yaptı'),
  ('follow', 'email', 'tr', 'Yeni takipçi', '{{actorName}} sizi takip etmeye başladı'),
  ('message', 'email', 'tr', 'Yeni mesaj', '{{actorName}}: {{body}}'),
  ('message', 'sms', 'tr', null, 'MediaMedicine: {{actorName}} size mesaj gönderdi'),
  ('message', 'telegram', 'tr', null, '{{actorName}}: {{body}}'),
  ('like', 'push', 'tr', null, '{{actorName}} gönderinizi beğendi'),
  ('comment', 'push', 'tr', null, '{{actorName}} yorum yaptı'),
  ('follow', 'push', 'tr', null, '{{actorName}} sizi takip etti'),
  ('message', 'push', 'tr', null, '{{actorName}}: {{body}}')
on conflict (key, channel, locale) do nothing;

insert into public.system_settings (key, value, description) values
  (
    'communication.enabled_channels',
    '["realtime","push","email","sms","telegram","in_app"]'::jsonb,
    'Globally enabled outbound notification channels'
  ),
  (
    'communication.rate_limits',
    '{"push_per_user_per_hour": 60, "email_per_user_per_hour": 20, "sms_per_user_per_hour": 10}'::jsonb,
    'Per-user channel rate limits (enforced in communication-dispatch v1 lightly)'
  )
on conflict (key) do nothing;

-- Claim pending deliveries for worker (service role via RPC)
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
      and nd.locked_at is null
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

revoke all on function public.claim_pending_notification_deliveries(integer, text) from public;
grant execute on function public.claim_pending_notification_deliveries(integer, text) to service_role;

create or replace function public.should_notify_channel(
  p_user_id uuid,
  p_profile_id uuid,
  p_event_type text,
  p_channel text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.should_notify_channel(p_user_id, p_profile_id, p_event_type, p_channel);
$$;

revoke all on function public.should_notify_channel(uuid, uuid, text, text) from public;
grant execute on function public.should_notify_channel(uuid, uuid, text, text) to service_role;

alter table public.notification_templates enable row level security;

create policy notification_templates_select on public.notification_templates
  for select to authenticated using (true);
