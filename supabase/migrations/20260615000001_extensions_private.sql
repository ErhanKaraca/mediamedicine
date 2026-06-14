-- =============================================================================
-- Social Graph Faz 1 — 01: extensions + private schema helpers
-- =============================================================================

create schema if not exists private;

create extension if not exists citext with schema extensions;

create or replace function private.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.current_user_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select auth.uid();
$$;
