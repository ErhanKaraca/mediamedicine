-- =============================================================================
-- Messaging — conversations, messages, helpers, RLS
-- =============================================================================

create type public.conversation_type as enum ('direct', 'group_dm');

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  type        public.conversation_type not null default 'direct',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function private.set_updated_at();

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create index conversation_participants_profile_idx
  on public.conversation_participants (profile_id);

create table public.messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.conversations (id) on delete cascade,
  sender_profile_id   uuid not null references public.profiles (id) on delete cascade,
  actor_user_id       uuid not null references auth.users (id) on delete cascade,
  content             jsonb not null default '{}'::jsonb,
  content_plain       text,
  attachments         jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  edited_at           timestamptz,
  deleted_at          timestamptz,
  constraint messages_content_plain_len check (
    content_plain is null or char_length(content_plain) <= 2000
  )
);

create index messages_conversation_idx
  on public.messages (conversation_id, created_at desc)
  where deleted_at is null;

-- Direct conversation lookup: two profiles share exactly one direct conversation
create or replace function private.find_direct_conversation(
  p_profile_a uuid,
  p_profile_b uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.conversations c
  where c.type = 'direct'
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.profile_id = p_profile_a
    )
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.profile_id = p_profile_b
    )
    and (
      select count(*) from public.conversation_participants cp
      where cp.conversation_id = c.id
    ) = 2
  limit 1;
$$;

-- Messaging eligibility: user→pro/page; pro/page→pro/page; block check
create or replace function private.can_message(
  p_sender_profile_id uuid,
  p_recipient_profile_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sender_kind public.account_kind;
  v_recipient_kind public.account_kind;
begin
  if p_sender_profile_id = p_recipient_profile_id then
    return false;
  end if;

  if exists (
    select 1 from public.blocks b
    where (b.blocker_profile_id = p_sender_profile_id and b.blocked_profile_id = p_recipient_profile_id)
       or (b.blocker_profile_id = p_recipient_profile_id and b.blocked_profile_id = p_sender_profile_id)
  ) then
    return false;
  end if;

  select account_kind into v_sender_kind
  from public.profiles where id = p_sender_profile_id and deleted_at is null;

  select account_kind into v_recipient_kind
  from public.profiles where id = p_recipient_profile_id and deleted_at is null;

  if v_sender_kind is null or v_recipient_kind is null then
    return false;
  end if;

  if v_sender_kind = 'user' then
    return v_recipient_kind in ('professional', 'page');
  end if;

  return v_recipient_kind in ('professional', 'page');
end;
$$;

create or replace function private.is_conversation_participant(
  p_conversation_id uuid,
  p_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.profile_id = p_profile_id
  );
$$;

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy conversations_select on public.conversations for select to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profile_id
      where cp.conversation_id = conversations.id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy conversation_participants_select on public.conversation_participants for select to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp2
      join public.profiles p on p.id = cp2.profile_id
      where cp2.conversation_id = conversation_participants.conversation_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy conversation_participants_update on public.conversation_participants for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = conversation_participants.profile_id
        and p.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = conversation_participants.profile_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy messages_select on public.messages for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profile_id
      where cp.conversation_id = messages.conversation_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy messages_insert on public.messages for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = sender_profile_id and p.owner_user_id = (select auth.uid())
    )
    and private.is_conversation_participant(conversation_id, sender_profile_id)
  );

create policy messages_update on public.messages for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = messages.sender_profile_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- Realtime publication
alter publication supabase_realtime add table public.messages;

create or replace function public.can_message(
  p_sender_profile_id uuid,
  p_recipient_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_message(p_sender_profile_id, p_recipient_profile_id);
$$;

create or replace function public.find_direct_conversation(
  p_profile_a uuid,
  p_profile_b uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select private.find_direct_conversation(p_profile_a, p_profile_b);
$$;

revoke all on function public.can_message(uuid, uuid) from public;
grant execute on function public.can_message(uuid, uuid) to authenticated, service_role;

revoke all on function public.find_direct_conversation(uuid, uuid) from public;
grant execute on function public.find_direct_conversation(uuid, uuid) to authenticated, service_role;
