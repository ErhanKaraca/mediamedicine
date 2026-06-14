-- =============================================================================
-- Local development seed (supabase db reset)
-- Login: alice@example.com / bob@example.com / carol@example.com — Password123!
-- =============================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'alice@example.com',
   extensions.crypt('Password123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"alice","display_name":"Alice"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'bob@example.com',
   extensions.crypt('Password123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"bob","display_name":"Bob"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'carol@example.com',
   extensions.crypt('Password123!', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"username":"carol","display_name":"Carol Pro"}',
   '', '', '', '');

insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
values
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@example.com"}', 'email',
   now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@example.com"}', 'email',
   now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"carol@example.com"}', 'email',
   now(), now(), now());

-- Profiles auto-created by handle_new_user trigger; enrich + upgrade Carol to professional
update public.profiles set bio = 'Merhaba, Alice.' where slug = 'alice';
update public.profiles set bio = 'Bob burada.' where slug = 'bob';
update public.profiles
  set bio = 'Profesyonel hesap.', account_kind = 'professional', is_verified = true
  where slug = 'carol';

-- Fixed profile ids for references below
-- alice profile: select id from profiles where slug='alice'
-- carol profile: professional, can be followed

do $$
declare
  v_alice uuid;
  v_bob uuid;
  v_carol uuid;
  v_group uuid := 'gggg0001-0000-0000-0000-000000000001';
  v_post uuid := 'pppp0001-0000-0000-0000-000000000001';
begin
  select id into v_alice from public.profiles where slug = 'alice';
  select id into v_bob from public.profiles where slug = 'bob';
  select id into v_carol from public.profiles where slug = 'carol';

  insert into public.groups (id, slug, name, description, visibility, join_policy, created_by_profile_id)
  values (v_group, 'genel-tipta', 'Genel Tıpta', 'Seed grup', 'public', 'open', v_carol);

  insert into public.group_members (group_id, profile_id, role, status)
  values
    (v_group, v_carol, 'owner', 'active'),
    (v_group, v_alice, 'member', 'active'),
    (v_group, v_bob, 'member', 'active');

  insert into public.group_specialties (group_id, specialty_id)
  select v_group, id from public.specialties where slug = 'internal_medicine';

  insert into public.profile_specialties (profile_id, specialty_id)
  select v_carol, id from public.specialties where slug = 'cardiology';

  insert into public.user_specialties (profile_id, specialty_id, source)
  select v_alice, id, 'manual' from public.specialties where slug = 'internal_medicine';

  insert into public.posts (
    id, author_profile_id, actor_user_id, group_id,
    content, content_plain, post_type, content_type, visibility, status
  ) values (
    v_post, v_alice, '11111111-1111-1111-1111-111111111111', v_group,
    '{"root":{"children":[{"children":[{"text":"Alice''in ilk grup gönderisi!"}],"type":"paragraph"}],"type":"root"}}'::jsonb,
    'Alice''in ilk grup gönderisi!', 'standard', 'discussion', 'group_only', 'published'
  );
  -- post_specialties filled by inherit_group_specialties trigger

  insert into public.follows (follower_profile_id, following_profile_id)
  values (v_bob, v_carol), (v_alice, v_carol);

  insert into public.reactions (profile_id, post_id, type)
  values (v_bob, v_post, 'like');

  insert into public.comments (post_id, author_profile_id, actor_user_id, content, content_plain)
  values (
    v_post, v_bob, '22222222-2222-2222-2222-222222222222',
    '{"root":{"children":[{"children":[{"text":"Hoş geldin Alice!"}],"type":"paragraph"}],"type":"root"}}'::jsonb,
    'Hoş geldin Alice!'
  );

  insert into public.notifications (
    recipient_user_id, recipient_profile_id, actor_profile_id,
    event_type, entity_type, entity_id, title, body
  ) values (
    '11111111-1111-1111-1111-111111111111', v_alice, v_bob,
    'like', 'post', v_post, 'Bob gönderini beğendi', 'Alice''in ilk grup gönderisi!'
  );
end $$;
