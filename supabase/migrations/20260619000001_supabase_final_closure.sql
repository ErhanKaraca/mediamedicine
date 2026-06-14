-- =============================================================================
-- Final Supabase closure — direct conversation uniqueness + atomic get-or-create
-- =============================================================================

create table public.direct_conversation_pairs (
  profile_a       uuid not null references public.profiles (id) on delete cascade,
  profile_b       uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  primary key (profile_a, profile_b),
  constraint direct_pair_order check (profile_a < profile_b)
);

-- Backfill existing 1:1 direct conversations
insert into public.direct_conversation_pairs (profile_a, profile_b, conversation_id)
select
  least(cp1.profile_id, cp2.profile_id),
  greatest(cp1.profile_id, cp2.profile_id),
  c.id
from public.conversations c
join public.conversation_participants cp1 on cp1.conversation_id = c.id
join public.conversation_participants cp2
  on cp2.conversation_id = c.id and cp1.profile_id < cp2.profile_id
where c.type = 'direct'
  and (
    select count(*)::int from public.conversation_participants cp
    where cp.conversation_id = c.id
  ) = 2
on conflict do nothing;

create or replace function public.get_or_create_direct_conversation(
  p_profile_a uuid,
  p_profile_b uuid
)
returns table (conversation_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_low uuid;
  v_high uuid;
  v_conv uuid;
  v_created boolean := false;
begin
  if p_profile_a = p_profile_b then
    raise exception 'cannot create conversation with self';
  end if;

  v_low := least(p_profile_a, p_profile_b);
  v_high := greatest(p_profile_a, p_profile_b);

  select dcp.conversation_id into v_conv
  from public.direct_conversation_pairs dcp
  where dcp.profile_a = v_low and dcp.profile_b = v_high;

  if v_conv is not null then
    return query select v_conv, false;
    return;
  end if;

  insert into public.conversations (type) values ('direct')
  returning id into v_conv;

  insert into public.conversation_participants (conversation_id, profile_id)
  values (v_conv, p_profile_a), (v_conv, p_profile_b);

  begin
    insert into public.direct_conversation_pairs (profile_a, profile_b, conversation_id)
    values (v_low, v_high, v_conv);
    v_created := true;
  exception when unique_violation then
    delete from public.conversations where id = v_conv;
    select dcp.conversation_id into v_conv
    from public.direct_conversation_pairs dcp
    where dcp.profile_a = v_low and dcp.profile_b = v_high;
    v_created := false;
  end;

  return query select v_conv, v_created;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid, uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid, uuid)
  to authenticated, service_role;

alter table public.direct_conversation_pairs enable row level security;

create policy direct_conversation_pairs_select on public.direct_conversation_pairs
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.owner_user_id = (select auth.uid())
        and p.id in (direct_conversation_pairs.profile_a, direct_conversation_pairs.profile_b)
    )
  );

-- Participants may bump conversation sort timestamp (send-message uses user client)
create policy conversations_update_participant on public.conversations
  for update to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profile_id
      where cp.conversation_id = conversations.id
        and p.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profile_id
      where cp.conversation_id = conversations.id
        and p.owner_user_id = (select auth.uid())
    )
  );
