-- Session list/revoke for Workers API (service_role only).
-- Hosted Supabase GoTrue does not expose GET/DELETE /admin/users/{id}/sessions.

create or replace function public.list_user_auth_sessions(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.user_id,
    s.created_at,
    s.updated_at,
    s.refreshed_at::timestamptz,
    s.user_agent,
    s.ip::text
  from auth.sessions s
  where s.user_id = p_user_id
  order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc;
$$;

create or replace function public.revoke_user_auth_session(
  p_user_id uuid,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from auth.sessions
    where id = p_session_id and user_id = p_user_id
  ) then
    return false;
  end if;

  delete from auth.refresh_tokens
  where session_id = p_session_id;

  delete from auth.sessions
  where id = p_session_id and user_id = p_user_id;

  return true;
end;
$$;

revoke all on function public.list_user_auth_sessions(uuid) from public;
revoke all on function public.revoke_user_auth_session(uuid, uuid) from public;
grant execute on function public.list_user_auth_sessions(uuid) to service_role;
grant execute on function public.revoke_user_auth_session(uuid, uuid) to service_role;
