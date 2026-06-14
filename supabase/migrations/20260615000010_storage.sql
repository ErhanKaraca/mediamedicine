-- =============================================================================
-- Social Graph Faz 1 — 10: Storage policies
-- =============================================================================

-- post-attachments bucket policies (avatars + post-media declared in config.toml)
create policy storage_avatars_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy storage_avatars_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy storage_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- post-media: owner folder = profile_id
create policy storage_post_media_read on storage.objects for select to authenticated
  using (bucket_id = 'post-media');

create policy storage_post_media_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_post_media_update on storage.objects for update to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_post_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

-- post-attachments
create policy storage_post_attach_read on storage.objects for select to authenticated
  using (bucket_id = 'post-attachments');

create policy storage_post_attach_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-attachments'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_post_attach_update on storage.objects for update to authenticated
  using (
    bucket_id = 'post-attachments'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_post_attach_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-attachments'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );
