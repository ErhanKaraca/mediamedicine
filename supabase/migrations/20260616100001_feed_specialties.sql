-- =============================================================================
-- Feed v2 — 01: specialties catalog, content_type, junction tables + seed
-- =============================================================================

create type public.content_type as enum (
  'case_study', 'research_summary', 'clinical_question', 'discussion',
  'guideline_update', 'drug_update', 'patient_education', 'conference_summary'
);

create type public.specialty_source as enum ('onboarding', 'manual', 'inferred');

alter table public.posts
  add column content_type public.content_type not null default 'discussion';

create table public.specialties (
  id          uuid primary key default gen_random_uuid(),
  slug        extensions.citext not null unique,
  name_tr     text not null,
  name_en     text not null,
  parent_id   uuid references public.specialties (id) on delete set null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint specialties_slug_format check (slug ~ '^[a-z][a-z0-9_]*$')
);

create index specialties_parent_idx on public.specialties (parent_id) where is_active;
create index specialties_sort_idx on public.specialties (sort_order) where is_active;

create table public.post_specialties (
  post_id       uuid not null references public.posts (id) on delete cascade,
  specialty_id  uuid not null references public.specialties (id) on delete restrict,
  primary key (post_id, specialty_id)
);

create index post_specialties_specialty_idx on public.post_specialties (specialty_id, post_id);

create table public.user_specialties (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  specialty_id  uuid not null references public.specialties (id) on delete cascade,
  source        public.specialty_source not null default 'manual',
  weight        numeric(4, 2) not null default 1.0 check (weight > 0),
  created_at    timestamptz not null default now(),
  primary key (profile_id, specialty_id)
);

create index user_specialties_specialty_idx on public.user_specialties (specialty_id);

create table public.group_specialties (
  group_id      uuid not null references public.groups (id) on delete cascade,
  specialty_id  uuid not null references public.specialties (id) on delete cascade,
  primary key (group_id, specialty_id)
);

create table public.profile_specialties (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  specialty_id  uuid not null references public.specialties (id) on delete cascade,
  primary key (profile_id, specialty_id)
);

create table public.user_specialty_weights (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  specialty_id  uuid not null references public.specialties (id) on delete cascade,
  weight        numeric(8, 4) not null default 0 check (weight >= 0),
  updated_at    timestamptz not null default now(),
  primary key (profile_id, specialty_id)
);

create index user_specialty_weights_profile_idx
  on public.user_specialty_weights (profile_id, weight desc);

-- Seed specialty catalog
insert into public.specialties (slug, name_tr, name_en, sort_order) values
  ('cardiology', 'Kardiyoloji', 'Cardiology', 10),
  ('neurology', 'Nöroloji', 'Neurology', 20),
  ('orthopedics', 'Ortopedi', 'Orthopedics', 30),
  ('psychiatry', 'Psikiyatri', 'Psychiatry', 40),
  ('pediatrics', 'Pediatri', 'Pediatrics', 50),
  ('endocrinology', 'Endokrinoloji', 'Endocrinology', 60),
  ('internal_medicine', 'Dahiliye', 'Internal Medicine', 70),
  ('oncology', 'Onkoloji', 'Oncology', 80),
  ('emergency_medicine', 'Acil Tıp', 'Emergency Medicine', 90),
  ('pharmacology', 'Farmakoloji', 'Pharmacology', 100)
on conflict (slug) do nothing;

-- Dahiliye > alt uzmanlik hiyerarsisi (opsiyonel v1)
update public.specialties set parent_id = (select id from public.specialties where slug = 'internal_medicine')
where slug in ('cardiology', 'endocrinology') and parent_id is null;
