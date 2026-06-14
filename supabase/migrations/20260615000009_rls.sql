-- =============================================================================
-- Social Graph Faz 1 — 09: Row Level Security
-- =============================================================================

-- Enable RLS on all public tables
alter table public.platform_staff enable row level security;
alter table public.profiles enable row level security;
alter table public.professional_applications enable row level security;
alter table public.system_settings enable row level security;
alter table public.user_settings enable row level security;
alter table public.pages enable row level security;
alter table public.page_members enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.posts enable row level security;
alter table public.post_evidences enable row level security;
alter table public.media enable row level security;
alter table public.post_media enable row level security;
alter table public.link_previews enable row level security;
alter table public.content_pipeline_runs enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notification_event_types enable row level security;
alter table public.notifications enable row level security;
alter table public.user_notification_settings enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.user_devices enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.feed_seen_items enable row level security;

-- ----- profiles -----
create policy profiles_select on public.profiles for select to anon, authenticated
  using (deleted_at is null);

create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (owner_user_id = (select auth.uid()) and account_kind in ('user', 'professional'));

create policy profiles_update_own on public.profiles for update to authenticated
  using (owner_user_id = (select auth.uid()) or private.can_post_as(id, (select auth.uid())))
  with check (owner_user_id = (select auth.uid()) or private.can_post_as(id, (select auth.uid())));

-- ----- user_settings -----
create policy user_settings_select on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy user_settings_update on public.user_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----- professional_applications -----
create policy prof_app_select_own on public.professional_applications for select to authenticated
  using (user_id = (select auth.uid()));

create policy prof_app_insert_own on public.professional_applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

-- ----- pages / groups (read mostly public) -----
create policy pages_select on public.pages for select to anon, authenticated using (true);
create policy groups_select on public.groups for select to anon, authenticated using (true);

create policy page_members_select on public.page_members for select to authenticated using (true);
create policy group_members_select on public.group_members for select to authenticated using (true);

-- ----- follows -----
create policy follows_select on public.follows for select to anon, authenticated using (true);

create policy follows_insert on public.follows for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles fp
      where fp.id = follower_profile_id and fp.owner_user_id = (select auth.uid())
    )
  );

create policy follows_delete on public.follows for delete to authenticated
  using (
    exists (
      select 1 from public.profiles fp
      where fp.id = follower_profile_id and fp.owner_user_id = (select auth.uid())
    )
  );

-- ----- blocks -----
create policy blocks_manage on public.blocks for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = blocker_profile_id and p.owner_user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = blocker_profile_id and p.owner_user_id = (select auth.uid()))
  );

-- ----- posts -----
create policy posts_select on public.posts for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'published'
    and moderation_state = 'none'
    and (
      private.can_view_post(id, private.get_personal_profile_id((select auth.uid())))
      or visibility = 'public'
    )
  );

create policy posts_insert on public.posts for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and private.can_post_as(author_profile_id, (select auth.uid()))
  );

create policy posts_update on public.posts for update to authenticated
  using (
    actor_user_id = (select auth.uid()) or private.can_post_as(author_profile_id, (select auth.uid()))
  );

-- ----- post_evidences -----
create policy post_evidences_select on public.post_evidences for select to anon, authenticated using (true);

create policy post_evidences_insert on public.post_evidences for insert to authenticated
  with check (
    exists (
      select 1 from public.posts po
      where po.id = post_id and po.actor_user_id = (select auth.uid())
    )
  );

-- ----- media -----
create policy media_select on public.media for select to authenticated using (true);

create policy media_insert on public.media for insert to authenticated
  with check (uploader_user_id = (select auth.uid()));

create policy media_update on public.media for update to authenticated
  using (uploader_user_id = (select auth.uid()));

-- ----- post_media -----
create policy post_media_select on public.post_media for select to anon, authenticated using (true);

-- ----- comments -----
create policy comments_select on public.comments for select to anon, authenticated
  using (deleted_at is null and private.can_view_post(post_id, private.get_personal_profile_id((select auth.uid()))));

create policy comments_insert on public.comments for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = author_profile_id and p.owner_user_id = (select auth.uid()))
    and private.can_view_post(post_id, author_profile_id)
  );

create policy comments_update on public.comments for update to authenticated
  using (actor_user_id = (select auth.uid()));

-- ----- reactions -----
create policy reactions_select on public.reactions for select to anon, authenticated using (true);

create policy reactions_insert on public.reactions for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
    and private.can_view_post(post_id, profile_id)
  );

create policy reactions_delete on public.reactions for delete to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

-- ----- notifications -----
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_user_id = (select auth.uid()));

create policy notifications_update on public.notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()));

create policy notif_event_types_select on public.notification_event_types for select to authenticated using (true);

create policy user_notif_settings on public.user_notification_settings for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy user_devices on public.user_devices for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----- reports -----
create policy reports_insert on public.reports for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = reporter_profile_id and p.owner_user_id = (select auth.uid()))
  );

create policy reports_select_own on public.reports for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = reporter_profile_id and p.owner_user_id = (select auth.uid()))
  );

-- ----- feed_seen_items -----
create policy feed_seen on public.feed_seen_items for all to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.owner_user_id = (select auth.uid()))
  );

-- ----- link_previews (read all) -----
create policy link_previews_select on public.link_previews for select to anon, authenticated using (true);

-- Service role bypasses RLS by default for edge functions using service_role key
