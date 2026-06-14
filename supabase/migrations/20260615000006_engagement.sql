-- =============================================================================
-- Social Graph Faz 1 — 06: comments + reactions
-- =============================================================================

create table public.comments (
  id                  uuid primary key default gen_random_uuid(),
  post_id             uuid not null references public.posts (id) on delete cascade,
  author_profile_id   uuid not null references public.profiles (id) on delete cascade,
  actor_user_id       uuid not null references auth.users (id) on delete cascade,
  parent_comment_id   uuid references public.comments (id) on delete cascade,
  thread_depth        integer not null default 0 check (thread_depth >= 0 and thread_depth <= 3),
  content             jsonb not null default '{}'::jsonb,
  content_plain       text,
  status              public.post_lifecycle not null default 'published',
  moderation_state    public.moderation_state not null default 'none',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  constraint comments_content_plain_len check (
    content_plain is null or char_length(content_plain) <= 2000
  )
);

create index comments_post_created_idx on public.comments (post_id, created_at desc)
  where deleted_at is null;
create index comments_author_idx on public.comments (author_profile_id);

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function private.set_updated_at();

create or replace function private.comments_depth_trg()
returns trigger language plpgsql as $$
declare v_depth integer;
begin
  if new.parent_comment_id is null then
    new.thread_depth := 0;
  else
    select thread_depth + 1 into v_depth from public.comments where id = new.parent_comment_id;
    if v_depth is null then raise exception 'Parent comment not found'; end if;
    if v_depth >= 3 then raise exception 'Max comment depth exceeded'; end if;
    new.thread_depth := v_depth;
  end if;
  return new;
end;
$$;

create trigger trg_comments_depth
  before insert on public.comments
  for each row execute function private.comments_depth_trg();

create table public.reactions (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  post_id     uuid not null references public.posts (id) on delete cascade,
  type        text not null default 'like' check (type = 'like'),
  created_at  timestamptz not null default now(),
  primary key (profile_id, post_id, type)
);

create index reactions_post_idx on public.reactions (post_id);

create or replace function private.reactions_count_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set reaction_count = reaction_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_reactions_count
  after insert or delete on public.reactions
  for each row execute function private.reactions_count_trg();

create or replace function private.comments_count_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.deleted_at is null then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' and old.deleted_at is null then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  elsif tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
  end if;
  return null;
end;
$$;

create trigger trg_comments_count
  after insert or update or delete on public.comments
  for each row execute function private.comments_count_trg();
