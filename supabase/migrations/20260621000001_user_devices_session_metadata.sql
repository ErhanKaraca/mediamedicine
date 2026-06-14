-- Session metadata on user_devices (advices §8.1 — no user_auth_sessions table)

alter table public.user_devices
  add column if not exists gotrue_session_id uuid,
  add column if not exists device_name text,
  add column if not exists user_agent text;

alter table public.user_devices
  alter column push_token drop not null;

create unique index if not exists user_devices_session_uidx
  on public.user_devices (user_id, gotrue_session_id)
  where gotrue_session_id is not null;
