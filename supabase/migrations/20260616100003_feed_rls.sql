-- =============================================================================
-- Feed v2 — 03: RLS for feed tables + can_view_post extension
-- =============================================================================

alter table public.specialties enable row level security;
alter table public.post_specialties enable row level security;
alter table public.user_specialties enable row level security;
alter table public.group_specialties enable row level security;
alter table public.profile_specialties enable row level security;
alter table public.user_specialty_weights enable row level security;
alter table public.feed_impressions enable row level security;

-- specialties catalog: read-only for clients
create policy specialties_select on public.specialties for select to anon, authenticated
  using (is_active);

-- post_specialties
create policy post_specialties_select on public.post_specialties for select to anon, authenticated
  using (true);

create policy post_specialties_insert on public.post_specialties for insert to authenticated
  with check (
    exists (
      select 1 from public.posts po
      where po.id = post_id and po.actor_user_id = (select auth.uid())
    )
  );

-- user_specialties (explicit interest)
create policy user_specialties_select on public.user_specialties for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

create policy user_specialties_manage on public.user_specialties for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

-- group_specialties / profile_specialties: read public; write via service role
create policy group_specialties_select on public.group_specialties for select to anon, authenticated
  using (true);

create policy profile_specialties_select on public.profile_specialties for select to anon, authenticated
  using (true);

-- implicit weights: own profile only
create policy user_specialty_weights_select on public.user_specialty_weights for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

create policy user_specialty_weights_manage on public.user_specialty_weights for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

-- feed impressions
create policy feed_impressions_insert on public.feed_impressions for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

create policy feed_impressions_select on public.feed_impressions for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

-- Extend can_view_post for page_followers and professionals_only
create or replace function private.can_view_post(p_post_id uuid, p_viewer_profile_id uuid default null)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  p record;
  v_viewer_user uuid;
  v_viewer_kind public.account_kind;
begin
  select * into p from public.posts where id = p_post_id;
  if not found or p.deleted_at is not null or p.status <> 'published'
     or p.moderation_state not in ('none') then
    return false;
  end if;

  if p.visibility = 'public' and p.group_id is null then return true; end if;
  if p_viewer_profile_id is null then return p.visibility = 'public' and p.group_id is null; end if;

  if private.is_blocked(p_viewer_profile_id, p.author_profile_id) then return false; end if;

  select owner_user_id, account_kind into v_viewer_user, v_viewer_kind
  from public.profiles where id = p_viewer_profile_id;

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

  if p.visibility = 'professionals_only' and v_viewer_kind = 'professional' then
    return true;
  end if;

  if p.visibility = 'page_followers' and p.page_context_id is not null and exists (
    select 1 from public.follows f
    where f.follower_profile_id = p_viewer_profile_id
      and f.following_profile_id = p.page_context_id
  ) then return true; end if;

  if p.visibility = 'members_only' and p.page_context_id is not null and exists (
    select 1 from public.pages pg
    join public.page_members pm on pm.page_id = pg.id
    where pg.profile_id = p.page_context_id
      and pm.profile_id = p_viewer_profile_id
      and pm.status = 'active'
  ) then return true; end if;

  return false;
end;
$$;
