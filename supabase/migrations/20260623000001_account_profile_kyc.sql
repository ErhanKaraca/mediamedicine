-- =============================================================================
-- Account, Profile & KYC — consent catalog, KYC cases/documents, storage, exports
-- =============================================================================

-- ----- consent catalog -----
create table public.consent_versions (
  id            text primary key,
  type          text not null check (type in ('terms', 'privacy', 'marketing')),
  version       text not null,
  is_current    boolean not null default false,
  effective_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create unique index consent_versions_one_current_per_type
  on public.consent_versions (type)
  where is_current = true;

create table public.user_consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  terms_version   text not null,
  privacy_version text not null,
  marketing       boolean not null default false,
  ip_address      inet,
  user_agent      text,
  recorded_at     timestamptz not null default now()
);

create index user_consents_user_idx on public.user_consents (user_id, recorded_at desc);

-- ----- KYC -----
create type public.kyc_case_status as enum (
  'draft',
  'submitted',
  'under_review',
  'resubmit_required',
  'approved',
  'rejected',
  'withdrawn'
);

create type public.kyc_document_status as enum (
  'pending',
  'accepted',
  'rejected'
);

create type public.kyc_target_entity as enum ('profile', 'page');

create table public.kyc_case_types (
  code                      text not null,
  version                   integer not null,
  target_entity_type        public.kyc_target_entity not null,
  schema                    jsonb not null default '{}'::jsonb,
  required_document_types   text[] not null default '{}',
  is_current                boolean not null default false,
  created_at                timestamptz not null default now(),
  primary key (code, version)
);

create unique index kyc_case_types_one_current_per_code
  on public.kyc_case_types (code)
  where is_current = true;

create table public.kyc_cases (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  profile_id          uuid references public.profiles (id) on delete set null,
  case_type           text not null,
  case_type_version   integer not null,
  target_entity_type  public.kyc_target_entity not null,
  status              public.kyc_case_status not null default 'draft',
  payload             jsonb not null default '{}'::jsonb,
  review_notes        text,
  reviewed_at         timestamptz,
  reviewed_by         uuid references auth.users (id) on delete set null,
  submitted_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint kyc_cases_type_fk foreign key (case_type, case_type_version)
    references public.kyc_case_types (code, version)
);

create index kyc_cases_user_idx on public.kyc_cases (user_id, case_type, status);
create index kyc_cases_status_idx on public.kyc_cases (status, submitted_at desc nulls last);

create unique index kyc_cases_one_active_per_user_type
  on public.kyc_cases (user_id, case_type)
  where status not in ('approved', 'rejected', 'withdrawn');

create trigger trg_kyc_cases_updated_at
  before update on public.kyc_cases
  for each row execute function private.set_updated_at();

create table public.kyc_documents (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references public.kyc_cases (id) on delete cascade,
  document_type   text not null,
  storage_path    text not null,
  mime_type       text,
  file_size       bigint,
  status          public.kyc_document_status not null default 'pending',
  user_note       text,
  staff_note      text,
  superseded_by   uuid references public.kyc_documents (id) on delete set null,
  uploaded_at     timestamptz not null default now()
);

create index kyc_documents_case_idx on public.kyc_documents (case_id, document_type)
  where superseded_by is null;

-- pages ↔ institution KYC
alter table public.pages
  add column if not exists kyc_case_id uuid references public.kyc_cases (id) on delete set null;

create index pages_kyc_case_idx on public.pages (kyc_case_id) where kyc_case_id is not null;

-- GDPR export jobs (PR-8)
create table public.account_exports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  storage_path  text,
  expires_at    timestamptz,
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz,
  error_message text
);

create index account_exports_user_idx on public.account_exports (user_id, requested_at desc);

-- Extend moderation_actions for KYC audit
alter table public.moderation_actions
  drop constraint if exists moderation_actions_action_check;

alter table public.moderation_actions
  add constraint moderation_actions_action_check
  check (action in ('hide', 'remove', 'warn', 'ban', 'restore', 'kyc_approved', 'kyc_rejected'));

-- ----- seed consent versions -----
insert into public.consent_versions (id, type, version, is_current, effective_at) values
  ('terms_v1', 'terms', '1.0', true, now()),
  ('privacy_v1', 'privacy', '1.0', true, now())
on conflict (id) do nothing;

-- ----- seed KYC case types -----
insert into public.kyc_case_types (
  code, version, target_entity_type, is_current, required_document_types, schema
) values
(
  'healthcare_professional',
  1,
  'profile',
  true,
  array['diploma_or_license', 'identity_document'],
  '{
    "type": "object",
    "required": ["legalFullName", "professionType", "licenseNumber", "licenseIssuingAuthority", "attestationAccepted"],
    "properties": {
      "legalFullName": { "type": "string", "minLength": 2 },
      "professionType": { "type": "string" },
      "licenseNumber": { "type": "string" },
      "licenseIssuingAuthority": { "type": "string" },
      "primarySpecialtyId": { "type": "string", "format": "uuid" },
      "institutionName": { "type": "string" },
      "attestationAccepted": { "type": "boolean", "const": true }
    }
  }'::jsonb
),
(
  'healthcare_institution',
  1,
  'page',
  true,
  array['institution_registry', 'tax_certificate', 'representative_authorization'],
  '{
    "type": "object",
    "required": ["legalEntityName", "taxId", "registryNumber", "representativeName", "institutionType", "attestationAccepted"],
    "properties": {
      "legalEntityName": { "type": "string", "minLength": 2 },
      "taxId": { "type": "string" },
      "registryNumber": { "type": "string" },
      "representativeName": { "type": "string" },
      "institutionType": { "type": "string" },
      "intendedSlug": { "type": "string" },
      "attestationAccepted": { "type": "boolean", "const": true }
    }
  }'::jsonb
)
on conflict (code, version) do nothing;

-- ----- RLS -----
alter table public.consent_versions enable row level security;
alter table public.user_consents enable row level security;
alter table public.kyc_case_types enable row level security;
alter table public.kyc_cases enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.account_exports enable row level security;

create policy consent_versions_public_read on public.consent_versions
  for select to anon, authenticated using (true);

create policy user_consents_select_own on public.user_consents
  for select to authenticated using (user_id = (select auth.uid()));

create policy user_consents_insert_own on public.user_consents
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy kyc_case_types_read on public.kyc_case_types
  for select to anon, authenticated using (true);

create policy kyc_cases_select_own on public.kyc_cases
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_staff((select auth.uid())));

create policy kyc_cases_insert_own on public.kyc_cases
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy kyc_cases_update_own on public.kyc_cases
  for update to authenticated
  using (
    user_id = (select auth.uid()) and status in ('draft', 'resubmit_required')
  )
  with check (user_id = (select auth.uid()));

create policy kyc_documents_select on public.kyc_documents
  for select to authenticated
  using (
    exists (
      select 1 from public.kyc_cases kc
      where kc.id = kyc_documents.case_id
        and (
          kc.user_id = (select auth.uid())
          or private.is_platform_staff((select auth.uid()))
        )
    )
  );

create policy kyc_documents_insert_own on public.kyc_documents
  for insert to authenticated
  with check (
    exists (
      select 1 from public.kyc_cases kc
      where kc.id = kyc_documents.case_id
        and kc.user_id = (select auth.uid())
        and kc.status in ('draft', 'resubmit_required')
    )
  );

create policy kyc_documents_update_own on public.kyc_documents
  for update to authenticated
  using (
    exists (
      select 1 from public.kyc_cases kc
      where kc.id = kyc_documents.case_id
        and kc.user_id = (select auth.uid())
        and kc.status in ('draft', 'resubmit_required')
    )
  );

create policy account_exports_select_own on public.account_exports
  for select to authenticated using (user_id = (select auth.uid()));

create policy account_exports_insert_own on public.account_exports
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Block new professional_applications writes (KYC-only flow)
drop policy if exists prof_app_insert_own on public.professional_applications;

create policy prof_app_insert_blocked on public.professional_applications
  for insert to authenticated with check (false);

-- ----- storage: kyc-documents bucket -----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do nothing;

-- Extend can_read_storage_object for kyc-documents
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

  if p_bucket = 'kyc-documents' then
    if private.is_platform_staff(p_user_id) then
      return true;
    end if;
    return exists (
      select 1 from public.kyc_documents kd
      join public.kyc_cases kc on kc.id = kd.case_id
      where kd.storage_path = p_path
        and kd.superseded_by is null
        and kc.user_id = p_user_id
    );
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

create policy storage_kyc_documents_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'kyc-documents'
    and private.can_read_storage_object('kyc-documents', name, (select auth.uid()))
  );

create policy storage_kyc_documents_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_kyc_documents_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- account-exports bucket for GDPR data packages
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'account-exports',
  'account-exports',
  false,
  52428800,
  array['application/zip', 'application/json']::text[]
)
on conflict (id) do nothing;

create policy storage_kyc_documents_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy storage_account_exports_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'account-exports'
    and exists (
      select 1 from public.account_exports ae
      where ae.storage_path = name
        and ae.user_id = (select auth.uid())
        and ae.status = 'ready'
    )
  );
