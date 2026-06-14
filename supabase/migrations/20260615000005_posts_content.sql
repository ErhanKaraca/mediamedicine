-- =============================================================================
-- Social Graph Faz 1 — 05: posts, media, evidences, link previews, pipeline
-- =============================================================================

create type public.post_type as enum ('standard', 'quote', 'repost');
create type public.post_lifecycle as enum ('draft', 'scheduled', 'publishing', 'published', 'archived', 'deleted');
create type public.moderation_state as enum ('none', 'pending_review', 'flagged', 'under_review', 'hidden', 'removed', 'rejected');
create type public.processing_state as enum ('none', 'media_pending', 'pipeline_queued', 'pipeline_processing', 'pipeline_failed');
create type public.post_visibility as enum (
  'public', 'followers', 'page_followers', 'professionals_only',
  'group_only', 'members_only', 'unlisted', 'private'
);
create type public.reply_policy as enum ('everyone', 'followers', 'members', 'mentioned', 'none');
create type public.media_kind as enum ('image', 'video', 'document');
create type public.media_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.evidence_source_type as enum (
  'publication', 'clinical_guideline', 'book', 'news_article', 'external_url',
  'media_asset', 'own_experience', 'own_opinion', 'other'
);
create type public.evidence_identifier_type as enum (
  'doi', 'pmid', 'pmcid', 'isbn', 'issn', 'nct', 'eudract', 'url', 'custom'
);

create table public.posts (
  id                  uuid primary key default gen_random_uuid(),
  author_profile_id   uuid not null references public.profiles (id) on delete restrict,
  actor_user_id       uuid not null references auth.users (id) on delete restrict,
  group_id            uuid references public.groups (id) on delete set null,
  page_context_id     uuid references public.profiles (id) on delete set null,
  content             jsonb not null default '{}'::jsonb,
  content_plain       text,
  post_type           public.post_type not null default 'standard',
  quote_of_id         uuid references public.posts (id) on delete set null,
  visibility          public.post_visibility not null default 'public',
  reply_policy        public.reply_policy not null default 'everyone',
  allow_comments      boolean not null default true,
  allow_reactions     boolean not null default true,
  allow_reposts       boolean not null default true,
  status              public.post_lifecycle not null default 'published',
  moderation_state    public.moderation_state not null default 'none',
  processing_state    public.processing_state not null default 'none',
  metadata            jsonb not null default '{}'::jsonb,
  scheduled_at        timestamptz,
  published_at        timestamptz default now(),
  primary_media_id    uuid,
  reaction_count      integer not null default 0 check (reaction_count >= 0),
  comment_count       integer not null default 0 check (comment_count >= 0),
  repost_count        integer not null default 0 check (repost_count >= 0),
  view_count          integer not null default 0 check (view_count >= 0),
  is_pinned           boolean not null default false,
  is_sensitive        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  edited_at           timestamptz,
  deleted_at          timestamptz,
  constraint posts_content_plain_len check (
    content_plain is null or char_length(content_plain) <= 2000
  ),
  constraint posts_group_page_exclusive check (
    not (group_id is not null and page_context_id is not null)
  )
);

create index posts_author_created_idx on public.posts (author_profile_id, created_at desc)
  where deleted_at is null and status = 'published';
create index posts_group_created_idx on public.posts (group_id, created_at desc)
  where deleted_at is null and group_id is not null;
create index posts_page_context_idx on public.posts (page_context_id, created_at desc)
  where page_context_id is not null and deleted_at is null;
create index posts_quote_of_idx on public.posts (quote_of_id) where quote_of_id is not null;
create index posts_fts_idx on public.posts using gin (to_tsvector('turkish', coalesce(content_plain, '')))
  where deleted_at is null and content_plain is not null;

create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

create table public.post_evidences (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts (id) on delete cascade,
  display_order     integer not null default 0,
  source_type       public.evidence_source_type not null,
  identifier_type   public.evidence_identifier_type,
  identifier_value  text,
  title             text,
  authors           text,
  publisher         text,
  pub_year          integer check (pub_year is null or pub_year between 1000 and 3000),
  url               text,
  note              text,
  created_at        timestamptz not null default now()
);

create index post_evidences_post_idx on public.post_evidences (post_id);

create table public.media (
  id                uuid primary key default gen_random_uuid(),
  owner_profile_id  uuid not null references public.profiles (id) on delete cascade,
  uploader_user_id  uuid not null references auth.users (id) on delete cascade,
  kind              public.media_kind not null,
  bucket            text not null,
  storage_path      text not null,
  original_name     text not null,
  mime_type         text not null,
  file_size         bigint not null check (file_size > 0),
  width             integer,
  height            integer,
  duration_ms       integer,
  blurhash          text,
  variants          jsonb not null default '{}'::jsonb,
  status            public.media_status not null default 'pending',
  processing_error  text,
  created_at        timestamptz not null default now(),
  unique (bucket, storage_path)
);

create index media_owner_idx on public.media (owner_profile_id);
create index media_status_idx on public.media (status);

create table public.post_media (
  post_id        uuid not null references public.posts (id) on delete cascade,
  media_id       uuid not null references public.media (id) on delete cascade,
  display_order  integer not null default 0,
  alt_text       text,
  primary key (post_id, media_id)
);

alter table public.posts
  add constraint posts_primary_media_fk
  foreign key (primary_media_id) references public.media (id) on delete set null;

create table public.link_previews (
  url_hash    text primary key,
  url         text not null,
  title       text,
  description text,
  image_url   text,
  site_name   text,
  fetched_at  timestamptz not null default now()
);

create table public.content_pipeline_runs (
  id                 uuid primary key default gen_random_uuid(),
  resource_type      text not null check (resource_type in ('post', 'media', 'comment')),
  resource_id        uuid not null,
  actor_user_id      uuid references auth.users (id) on delete set null,
  actor_profile_id   uuid references public.profiles (id) on delete set null,
  idempotency_key    text not null unique,
  pipeline_version   text not null default 'v1',
  context            jsonb not null default '{}'::jsonb,
  status             text not null default 'context_recorded'
    check (status in ('context_recorded', 'processing', 'done', 'failed')),
  source             text not null default 'edge_function',
  request_id         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger trg_pipeline_runs_updated_at
  before update on public.content_pipeline_runs
  for each row execute function private.set_updated_at();

-- Post placement validation
create or replace function private.validate_post_placement()
returns trigger language plpgsql as $$
declare
  v_kind public.account_kind;
begin
  select account_kind into v_kind from public.profiles where id = new.author_profile_id;

  if v_kind = 'user' and new.group_id is null then
    raise exception 'User accounts can only post inside groups';
  end if;

  if new.group_id is not null and not private.is_group_member(new.group_id, new.author_profile_id) then
    raise exception 'Author must be an active group member to post';
  end if;

  if new.page_context_id is not null then
    if v_kind = 'page' then
      raise exception 'Page cannot post on another page wall as page_context';
    end if;
    if not exists (select 1 from public.pages where profile_id = new.page_context_id) then
      raise exception 'Invalid page_context_id';
    end if;
  end if;

  if not private.can_post_as(new.author_profile_id, new.actor_user_id) then
    raise exception 'Actor is not authorized to post as this profile';
  end if;

  return new;
end;
$$;

create trigger trg_posts_validate_placement
  before insert or update on public.posts
  for each row execute function private.validate_post_placement();

-- Counter: posts on profiles and groups
create or replace function private.posts_count_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.deleted_at is null and new.status = 'published' then
    update public.profiles set post_count = post_count + 1 where id = new.author_profile_id;
    if new.group_id is not null then
      update public.groups set post_count = post_count + 1 where id = new.group_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.profiles set post_count = greatest(post_count - 1, 0) where id = old.author_profile_id;
      if old.group_id is not null then
        update public.groups set post_count = greatest(post_count - 1, 0) where id = old.group_id;
      end if;
    end if;
  elsif tg_op = 'DELETE' and old.deleted_at is null and old.status = 'published' then
    update public.profiles set post_count = greatest(post_count - 1, 0) where id = old.author_profile_id;
    if old.group_id is not null then
      update public.groups set post_count = greatest(post_count - 1, 0) where id = old.group_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger trg_posts_count
  after insert or update or delete on public.posts
  for each row execute function private.posts_count_trg();
