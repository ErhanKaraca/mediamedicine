-- =============================================================================
-- Messaging — message-media storage policies
-- =============================================================================

create policy storage_message_media_read on storage.objects for select to authenticated
  using (bucket_id = 'message-media');

create policy storage_message_media_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_message_media_update on storage.objects for update to authenticated
  using (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );

create policy storage_message_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'message-media'
    and (storage.foldername(name))[1] in (
      select p.id::text from public.profiles p where p.owner_user_id = (select auth.uid())
    )
  );
