-- Private Collaborative Family Network
-- PostgreSQL/Supabase-oriented schema draft for a production implementation.
-- People are graph nodes. Relationships are graph edges. Personal information,
-- structural relationships, and media are versioned separately.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type membership_role as enum ('owner', 'admin', 'member', 'viewer');
create type membership_status as enum ('active', 'removed', 'left');
create type relationship_kind as enum (
  'biological_parent',
  'adoptive_parent',
  'step_parent',
  'foster_parent',
  'guardian',
  'spouse',
  'partner',
  'former_spouse',
  'former_partner',
  'sibling'
);
create type visibility_level as enum ('family', 'connections', 'only_me');
create type request_status as enum ('pending', 'approved', 'declined', 'cancelled');
create type suggestion_status as enum ('pending', 'accepted', 'edited_accepted', 'dismissed');
create type entity_kind as enum (
  'family_space',
  'person',
  'relationship',
  'profile_field',
  'photo',
  'invitation',
  'access_request',
  'theme_settings'
);

create table app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_space (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  created_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table theme_settings (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null unique references family_space (id),
  family_name text not null,
  theme text not null default 'gallery',
  accent_colour text not null default '#2f6f73',
  family_mark_storage_path text,
  typography text not null default 'system',
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  check (theme in ('gallery', 'heritage', 'dark', 'colour', 'minimal'))
);

create table family_membership (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  user_id uuid not null references app_user (id),
  role membership_role not null default 'member',
  status membership_status not null default 'active',
  invited_by uuid references app_user (id),
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_space_id, user_id)
);

create table person (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  display_name text not null,
  preferred_name text,
  birth_date date,
  birth_year int,
  death_date date,
  death_year int,
  gender text,
  pronouns text,
  primary_photo_id uuid,
  claimed_by uuid references app_user (id),
  steward_user_id uuid references app_user (id),
  created_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_record_id uuid,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(display_name, '') || ' ' || coalesce(preferred_name, ''))
  ) stored,
  check (birth_year is null or birth_year between 1 and 3000),
  check (death_year is null or death_year between 1 and 3000)
);

create table person_claim (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  person_id uuid not null references person (id),
  requester_user_id uuid not null references app_user (id),
  status request_status not null default 'pending',
  verification_note text,
  resolved_by uuid references app_user (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (person_id, requester_user_id)
);

create table relationship (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  from_person_id uuid not null references person (id),
  to_person_id uuid not null references person (id),
  kind relationship_kind not null,
  start_date date,
  end_date date,
  confidence text not null default 'family_recorded',
  notes text,
  created_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_record_id uuid,
  check (from_person_id <> to_person_id)
);

create table relationship_revision (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references relationship (id),
  family_space_id uuid not null references family_space (id),
  actor_user_id uuid not null references app_user (id),
  previous_state jsonb,
  new_state jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);

create table profile_field (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  person_id uuid not null references person (id),
  category text not null,
  label text not null,
  value_text text,
  value_json jsonb not null default '{}'::jsonb,
  visibility visibility_level not null default 'family',
  is_sensitive boolean not null default false,
  owner_user_id uuid references app_user (id),
  steward_user_id uuid references app_user (id),
  added_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_record_id uuid,
  check (value_text is not null or value_json <> '{}'::jsonb)
);

create table profile_field_revision (
  id uuid primary key default gen_random_uuid(),
  profile_field_id uuid not null references profile_field (id),
  family_space_id uuid not null references family_space (id),
  actor_user_id uuid not null references app_user (id),
  previous_state jsonb,
  new_state jsonb not null,
  created_at timestamptz not null default now()
);

create table edit_suggestion (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  person_id uuid not null references person (id),
  target_profile_field_id uuid references profile_field (id),
  proposed_label text,
  proposed_value_text text,
  proposed_value_json jsonb not null default '{}'::jsonb,
  proposed_visibility visibility_level,
  message text,
  suggested_by uuid not null references app_user (id),
  status suggestion_status not null default 'pending',
  resolved_by uuid references app_user (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table photo (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  original_storage_path text not null,
  optimized_storage_paths jsonb not null default '{}'::jsonb,
  caption text,
  approximate_photo_date date,
  approximate_year int,
  visibility visibility_level not null default 'family',
  uploaded_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deletion_record_id uuid
);

alter table person
  add constraint person_primary_photo_fk
  foreign key (primary_photo_id) references photo (id);

create table photo_person_tag (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  photo_id uuid not null references photo (id),
  person_id uuid not null references person (id),
  tagged_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (photo_id, person_id)
);

create table invitation (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  email citext not null,
  role membership_role not null default 'member',
  token_hash text not null,
  invited_by uuid not null references app_user (id),
  accepted_by uuid references app_user (id),
  status request_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table access_request (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  name text not null,
  email citext not null,
  message text,
  status request_status not null default 'pending',
  resolved_by uuid references app_user (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table activity_event (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  actor_user_id uuid references app_user (id),
  entity_kind entity_kind not null,
  entity_id uuid,
  action text not null,
  previous_state jsonb,
  new_state jsonb,
  restoration_metadata jsonb,
  created_at timestamptz not null default now()
);

create table deletion_record (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  entity_name text not null,
  deleted_by uuid not null references app_user (id),
  deleted_at timestamptz not null default now(),
  previous_state jsonb not null,
  restored_by uuid references app_user (id),
  restored_at timestamptz,
  legal_hold boolean not null default false
);

alter table person
  add constraint person_deletion_record_fk
  foreign key (deletion_record_id) references deletion_record (id);

alter table relationship
  add constraint relationship_deletion_record_fk
  foreign key (deletion_record_id) references deletion_record (id);

alter table profile_field
  add constraint profile_field_deletion_record_fk
  foreign key (deletion_record_id) references deletion_record (id);

alter table photo
  add constraint photo_deletion_record_fk
  foreign key (deletion_record_id) references deletion_record (id);

create table snapshot (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  snapshot_kind text not null default 'scheduled',
  storage_path text not null,
  checksum text not null,
  covered_until timestamptz not null,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  restore_tested_at timestamptz
);

create table permission_exception (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references family_space (id),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  user_id uuid not null references app_user (id),
  permission text not null,
  granted_by uuid not null references app_user (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index family_membership_space_user_idx
  on family_membership (family_space_id, user_id)
  where status = 'active';

create index person_space_search_idx
  on person using gin (search_vector)
  where deleted_at is null;

create index relationship_space_from_idx
  on relationship (family_space_id, from_person_id)
  where deleted_at is null;

create index relationship_space_to_idx
  on relationship (family_space_id, to_person_id)
  where deleted_at is null;

create index profile_field_person_idx
  on profile_field (family_space_id, person_id)
  where deleted_at is null;

create index profile_field_aggregate_idx
  on profile_field (family_space_id, label, visibility)
  where deleted_at is null and is_sensitive = false;

create index activity_event_space_time_idx
  on activity_event (family_space_id, created_at desc);

create index photo_tag_person_idx
  on photo_person_tag (family_space_id, person_id)
  where deleted_at is null;

create or replace function is_family_member(space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from family_membership
    where family_space_id = space_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function membership_role_for(space_id uuid)
returns membership_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from family_membership
  where family_space_id = space_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function is_space_admin(space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select membership_role_for(space_id) in ('owner', 'admin');
$$;

create or replace function owns_claimed_person(target_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from person
    where id = target_person_id
      and claimed_by = auth.uid()
      and deleted_at is null
  );
$$;

alter table family_space enable row level security;
alter table theme_settings enable row level security;
alter table family_membership enable row level security;
alter table person enable row level security;
alter table person_claim enable row level security;
alter table relationship enable row level security;
alter table relationship_revision enable row level security;
alter table profile_field enable row level security;
alter table profile_field_revision enable row level security;
alter table edit_suggestion enable row level security;
alter table photo enable row level security;
alter table photo_person_tag enable row level security;
alter table invitation enable row level security;
alter table access_request enable row level security;
alter table activity_event enable row level security;
alter table deletion_record enable row level security;
alter table snapshot enable row level security;
alter table permission_exception enable row level security;

create policy "members can read their family spaces"
  on family_space for select
  using (is_family_member(id));

create policy "admins can update family spaces"
  on family_space for update
  using (is_space_admin(id))
  with check (is_space_admin(id));

create policy "members can read active people"
  on person for select
  using (deleted_at is null and is_family_member(family_space_id));

create policy "members can add people"
  on person for insert
  with check (is_family_member(family_space_id));

create policy "person owners and admins can update person shells"
  on person for update
  using (is_space_admin(family_space_id) or owns_claimed_person(id) or steward_user_id = auth.uid())
  with check (is_space_admin(family_space_id) or owns_claimed_person(id) or steward_user_id = auth.uid());

create policy "members can read active relationships"
  on relationship for select
  using (deleted_at is null and is_family_member(family_space_id));

create policy "admins can write structural relationships"
  on relationship for all
  using (is_space_admin(family_space_id))
  with check (is_space_admin(family_space_id));

create policy "members can propose structural additions"
  on relationship for insert
  with check (is_family_member(family_space_id));

create policy "profile fields follow visibility"
  on profile_field for select
  using (
    deleted_at is null
    and is_family_member(family_space_id)
    and (
      visibility = 'family'
      or owner_user_id = auth.uid()
      or steward_user_id = auth.uid()
      or is_space_admin(family_space_id)
    )
  );

create policy "owners and stewards can update fields"
  on profile_field for update
  using (
    owner_user_id = auth.uid()
    or steward_user_id = auth.uid()
    or is_space_admin(family_space_id)
  )
  with check (
    owner_user_id = auth.uid()
    or steward_user_id = auth.uid()
    or is_space_admin(family_space_id)
  );

create policy "members can add non-owned field suggestions"
  on edit_suggestion for insert
  with check (is_family_member(family_space_id) and suggested_by = auth.uid());

create policy "members can read relevant suggestions"
  on edit_suggestion for select
  using (
    is_space_admin(family_space_id)
    or suggested_by = auth.uid()
    or owns_claimed_person(person_id)
  );

create policy "members can read permitted photos"
  on photo for select
  using (
    deleted_at is null
    and is_family_member(family_space_id)
    and (visibility = 'family' or uploaded_by = auth.uid())
  );

create policy "admins can read access requests"
  on access_request for select
  using (is_space_admin(family_space_id));

create policy "anyone can create access requests"
  on access_request for insert
  with check (status = 'pending');

create policy "members can read activity"
  on activity_event for select
  using (is_family_member(family_space_id));

create policy "admins can read deletion records and snapshots"
  on deletion_record for select
  using (is_space_admin(family_space_id));

create policy "admins can read snapshots"
  on snapshot for select
  using (is_space_admin(family_space_id));

-- Production mutation flow:
-- 1. Write operations should run through server actions or RPCs, not direct
--    broad client updates.
-- 2. Every mutation inserts activity_event and the matching revision row inside
--    the same transaction.
-- 3. Deletes set deleted_at and create deletion_record. Permanent deletion is
--    reserved for protected privacy/legal flows.
-- 4. Relationship updates are recoverable through relationship_revision plus
--    scheduled snapshot rows and off-database media backups.
