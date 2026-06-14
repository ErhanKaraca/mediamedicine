-- =============================================================================
-- Supabase layer closure — audit fixes before API phase
-- =============================================================================

-- 1. handle_new_user: slug collision → suffix retry (max 5)
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_slug text;
  v_attempt integer := 0;
  v_inserted boolean := false;
begin
  v_slug := coalesce(
    new.raw_user_meta_data ->> 'username',
    'user_' || replace(substr(new.id::text, 1, 8), '-', '')
  );

  while v_attempt < 5 and not v_inserted loop
    begin
      insert into public.profiles (owner_user_id, account_kind, slug, display_name, avatar_url)
      values (
        new.id,
        'user',
        v_slug,
        coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
        new.raw_user_meta_data ->> 'avatar_url'
      );
      v_inserted := true;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      v_slug := coalesce(new.raw_user_meta_data ->> 'username', 'user')
        || '_' || substr(replace(new.id::text, '-', ''), 1, 6 + v_attempt);
    end;
  end loop;

  if not v_inserted then
    insert into public.profiles (owner_user_id, account_kind, slug, display_name, avatar_url)
    values (
      new.id,
      'user',
      'user_' || replace(new.id::text, '-', ''),
      coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (slug) do nothing;
  end if;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- 2. repost_count counter
create or replace function private.repost_count_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT'
     and new.post_type = 'repost'
     and new.quote_of_id is not null
     and new.deleted_at is null
     and new.status = 'published' then
    update public.posts
    set repost_count = repost_count + 1
    where id = new.quote_of_id;
  elsif tg_op = 'UPDATE'
     and old.post_type = 'repost'
     and old.quote_of_id is not null
     and old.deleted_at is null
     and new.deleted_at is not null then
    update public.posts
    set repost_count = greatest(repost_count - 1, 0)
    where id = old.quote_of_id;
  elsif tg_op = 'DELETE'
     and old.post_type = 'repost'
     and old.quote_of_id is not null
     and old.deleted_at is null then
    update public.posts
    set repost_count = greatest(repost_count - 1, 0)
    where id = old.quote_of_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_repost_count on public.posts;
create trigger trg_repost_count
  after insert or update or delete on public.posts
  for each row execute function private.repost_count_trg();

-- 3. is_platform_staff: role-based access for moderators without explicit permissions
create or replace function private.is_platform_staff(p_user_id uuid, p_permission text default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_staff ps
    where ps.user_id = p_user_id
      and ps.status = 'active'
      and (
        p_permission is null
        or ps.role = 'super_admin'
        or p_permission = any(ps.permissions)
        or ps.role in ('moderator', 'content_ops', 'support')
      )
  );
$$;

-- 4. Storage read helper (visibility-aware)
create or replace function private.can_read_storage_object(
  p_bucket text,
  p_path text,
  p_user_id uuid
)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_viewer_profile uuid;
  v_folder text;
begin
  if p_user_id is null then
    return false;
  end if;

  v_viewer_profile := private.get_personal_profile_id(p_user_id);
  v_folder := split_part(p_path, '/', 1);

  if p_bucket in ('post-media', 'post-attachments') then
    if exists (
      select 1 from public.profiles p
      where p.owner_user_id = p_user_id and p.id::text = v_folder
    ) then
      return true;
    end if;

    return exists (
      select 1 from public.media m
      join public.post_media pm on pm.media_id = m.id
      where m.bucket = p_bucket
        and m.storage_path = p_path
        and private.can_view_post(pm.post_id, v_viewer_profile)
    );
  end if;

  if p_bucket = 'message-media' then
    if exists (
      select 1 from public.profiles p
      where p.owner_user_id = p_user_id and p.id::text = v_folder
    ) then
      return true;
    end if;

    return exists (
      select 1 from public.media m
      where m.bucket = 'message-media'
        and m.storage_path = p_path
        and exists (
          select 1 from public.messages msg
          join public.conversation_participants cp on cp.conversation_id = msg.conversation_id
          join public.profiles vp on vp.id = cp.profile_id and vp.owner_user_id = p_user_id
          where msg.deleted_at is null
            and msg.attachments::text like '%' || m.id::text || '%'
        )
    );
  end if;

  return false;
end;
$$;

drop policy if exists storage_post_media_read on storage.objects;
create policy storage_post_media_read on storage.objects for select to authenticated
  using (
    bucket_id = 'post-media'
    and private.can_read_storage_object('post-media', name, (select auth.uid()))
  );

drop policy if exists storage_post_attach_read on storage.objects;
create policy storage_post_attach_read on storage.objects for select to authenticated
  using (
    bucket_id = 'post-attachments'
    and private.can_read_storage_object('post-attachments', name, (select auth.uid()))
  );

drop policy if exists storage_message_media_read on storage.objects;
create policy storage_message_media_read on storage.objects for select to authenticated
  using (
    bucket_id = 'message-media'
    and private.can_read_storage_object('message-media', name, (select auth.uid()))
  );

-- 5. RLS gaps
create policy groups_insert on public.groups for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = created_by_profile_id and p.owner_user_id = (select auth.uid())
    )
  );

create policy groups_update on public.groups for update to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      join public.profiles p on p.id = gm.profile_id
      where gm.group_id = groups.id
        and gm.role in ('owner', 'admin')
        and gm.status = 'active'
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy group_members_insert_self on public.group_members for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.owner_user_id = (select auth.uid())
    )
  );

create policy pages_insert on public.pages for insert to authenticated
  with check (
    created_by_user_id = (select auth.uid())
    or private.is_platform_staff((select auth.uid()))
  );

create policy pages_update on public.pages for update to authenticated
  using (
    exists (
      select 1 from public.page_members pm
      join public.profiles p on p.id = pm.profile_id
      where pm.page_id = pages.id
        and pm.role in ('owner', 'admin')
        and pm.status = 'active'
        and p.owner_user_id = (select auth.uid())
    )
    or private.is_platform_staff((select auth.uid()))
  );

create policy page_members_insert on public.page_members for insert to authenticated
  with check (
    exists (
      select 1 from public.page_members pm
      join public.profiles p on p.id = pm.profile_id
      where pm.page_id = page_members.page_id
        and pm.role in ('owner', 'admin')
        and pm.status = 'active'
        and p.owner_user_id = (select auth.uid())
    )
    or private.is_platform_staff((select auth.uid()))
  );

create policy moderation_actions_staff_select on public.moderation_actions
  for select to authenticated
  using (private.is_platform_staff((select auth.uid())));

create policy notification_deliveries_select on public.notification_deliveries
  for select to authenticated
  using (
    exists (
      select 1 from public.notifications n
      where n.id = notification_deliveries.notification_id
        and n.recipient_user_id = (select auth.uid())
    )
    or private.is_platform_staff((select auth.uid()))
  );

create policy content_pipeline_runs_select on public.content_pipeline_runs
  for select to authenticated
  using (
    actor_user_id = (select auth.uid())
    or private.is_platform_staff((select auth.uid()))
  );

create policy platform_staff_self_select on public.platform_staff
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy system_settings_read on public.system_settings
  for select to authenticated
  using (true);
