-- =============================================================================
-- Feed v2 — 04: specialty validation + group inherit helper
-- =============================================================================

-- Inherit group specialties into post (called from edge or trigger context)
create or replace function private.inherit_group_specialties(p_post_id uuid, p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.post_specialties (post_id, specialty_id)
  select p_post_id, gs.specialty_id
  from public.group_specialties gs
  where gs.group_id = p_group_id
  on conflict do nothing;
end;
$$;

-- Ensure pro/page posts have at least one specialty after post_specialties change
create or replace function private.validate_post_specialties()
returns trigger language plpgsql as $$
declare
  v_post_id uuid;
  v_kind public.account_kind;
  v_count integer;
begin
  v_post_id := coalesce(new.post_id, old.post_id);

  select pr.account_kind into v_kind
  from public.posts po
  join public.profiles pr on pr.id = po.author_profile_id
  where po.id = v_post_id;

  if v_kind not in ('professional', 'page') then
    return null;
  end if;

  select count(*) into v_count from public.post_specialties where post_id = v_post_id;

  if v_count = 0 then
    raise exception 'Professional/page posts require at least one specialty';
  end if;

  return null;
end;
$$;

create constraint trigger trg_validate_post_specialties
  after insert or update or delete on public.post_specialties
  deferrable initially deferred
  for each row execute function private.validate_post_specialties();

-- Auto-inherit group specialties when a group post is created without specialties yet
create or replace function private.post_inherit_group_specialties_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.group_id is not null and not exists (
    select 1 from public.post_specialties where post_id = new.id
  ) then
    perform private.inherit_group_specialties(new.id, new.group_id);
  end if;
  return new;
end;
$$;

create trigger trg_posts_inherit_group_specialties
  after insert on public.posts
  for each row execute function private.post_inherit_group_specialties_trg();

-- Seed system setting for feed
insert into public.system_settings (key, value, description) values
  ('feed.discovery_min_quality_score', '40'::jsonb, 'Minimum MQS for discovery pool candidates'),
  ('feed.academic_content_types', '["guideline_update","drug_update","research_summary"]'::jsonb, 'Content types for academic pool')
on conflict (key) do nothing;
