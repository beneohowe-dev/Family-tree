-- Motion Community OS
-- Supabase/PostgreSQL schema draft for a private relationship intelligence platform.
-- Raw evidence is kept separate from interpreted intelligence. Sensitive research
-- status is separate from outreach eligibility.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;
create extension if not exists vector;

create type app_role as enum ('owner', 'admin', 'researcher', 'viewer');
create type confidence_level as enum ('HIGH', 'MEDIUM', 'LOW');
create type warmth_level as enum ('HOT', 'WARM', 'KNOWN', 'LIGHT', 'CONNECTED', 'COLD', 'UNKNOWN');
create type risk_level as enum ('LOW', 'MEDIUM', 'HIGH');
create type source_access_type as enum ('api', 'feed', 'import', 'manual', 'web_search');
create type source_status as enum (
  'READY',
  'READY_MANUAL_IMPORT',
  'CONFIG_REQUIRED',
  'AWAITING_API_ACCESS',
  'UNAVAILABLE_APPROVED_METHOD_ONLY',
  'PAUSED'
);
create type sensitive_data_status as enum (
  'NONE_RECORDED',
  'EXPLICIT_PUBLIC_EVIDENCE',
  'REQUIRES_REVIEW',
  'SUPPRESSED'
);
create type human_decision as enum (
  'SHORTLIST',
  'INTERESTING',
  'NOT_RELEVANT',
  'WRONG_ROLE',
  'HOLD',
  'APPROACH',
  'CONTACTED',
  'ACTIVE_RELATIONSHIP',
  'PARTNER',
  'AMBASSADOR',
  'ADVISER',
  'DO_NOT_CONTACT'
);
create type opportunity_status as enum ('NEW', 'REVIEW_REQUIRED', 'SHORTLISTED', 'HOLD', 'APPROVED', 'DONE');
create type scan_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type entity_kind as enum ('person', 'organisation', 'topic', 'campaign', 'event');

create table app_user (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_membership (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_user (id) on delete cascade,
  role app_role not null default 'viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  logo_storage_path text,
  sector text,
  organisation_type text not null,
  country text,
  region text,
  description text,
  purpose text,
  relationship_to_motion text,
  potential_motion_contribution text[] not null default '{}',
  current_partnerships text[] not null default '{}',
  relevant_campaigns text[] not null default '{}',
  relevant_funding_activity text[] not null default '{}',
  notes text,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(sector, '') || ' ' ||
      coalesce(organisation_type, '') || ' ' ||
      coalesce(country, '') || ' ' ||
      coalesce(description, '')
    )
  ) stored
);

create table people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  preferred_name text,
  profile_image_storage_path text,
  current_headline text,
  current_role text,
  organisation_id uuid references organisations (id),
  previous_organisations text[] not null default '{}',
  previous_roles text[] not null default '{}',
  country text,
  region text,
  city text,
  languages text[] not null default '{}',
  primary_motion_role text,
  geographic_usefulness text[] not null default '{}',
  estimated_strategic_value text check (estimated_strategic_value in ('HIGH', 'MEDIUM', 'LOW')),
  relationship_warmth warmth_level not null default 'UNKNOWN',
  approachability text check (approachability in ('HIGH', 'MEDIUM', 'LOW')),
  current_relevance text check (current_relevance in ('HIGH', 'MEDIUM', 'LOW')),
  evidence_confidence confidence_level not null default 'LOW',
  human_decision human_decision not null default 'INTERESTING',
  recommended_motion_role text,
  recommended_foundation_role text,
  suppression_reason text,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(preferred_name, '') || ' ' ||
      coalesce(current_headline, '') || ' ' ||
      coalesce(current_role, '') || ' ' ||
      coalesce(country, '') || ' ' ||
      coalesce(city, '')
    )
  ) stored
);

create table role_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  role_group_id uuid references role_groups (id) on delete set null,
  name text not null unique,
  description text,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now()
);

create table person_roles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  role_id uuid not null references roles (id) on delete cascade,
  role_context text not null default 'motion',
  confidence confidence_level not null default 'MEDIUM',
  source_evidence_id uuid,
  created_at timestamptz not null default now(),
  unique (person_id, role_id, role_context)
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table person_skills (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  confidence confidence_level not null default 'MEDIUM',
  source_evidence_id uuid,
  unique (person_id, skill_id)
);

create table privacy_status (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete cascade,
  sensitive_data_status sensitive_data_status not null default 'NONE_RECORDED',
  source_type text not null default 'none',
  explicit_self_disclosure boolean not null default false,
  evidence_url text,
  evidence_date date,
  allowed_for_research boolean not null default true,
  allowed_for_outreach boolean not null default false,
  requires_review boolean not null default true,
  lawful_use_status text not null default 'needs_review',
  purpose text not null default 'community_research',
  retention_until date,
  reviewed_by uuid references app_user (id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((person_id is not null)::int + (organisation_id is not null)::int = 1)
);

create table suppression_list (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete cascade,
  reason text not null,
  applies_to_outreach boolean not null default true,
  applies_to_processing boolean not null default false,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  revoked_by uuid references app_user (id),
  revoked_at timestamptz,
  check ((person_id is not null)::int + (organisation_id is not null)::int = 1)
);

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete cascade,
  platform text not null,
  account_url text not null,
  username text,
  account_type text not null default 'unknown',
  verified_visible boolean,
  date_last_checked date,
  matching_confidence confidence_level not null default 'LOW',
  match_evidence text not null,
  requires_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, account_url),
  check ((person_id is not null)::int + (organisation_id is not null)::int = 1)
);

create table person_contact_methods (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  contact_type text not null check (contact_type in ('email', 'mobile', 'website', 'social', 'intro')),
  label text not null,
  value text not null,
  href text not null,
  is_primary boolean not null default false,
  source_evidence_id uuid,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table person_workflow_state (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references people (id) on delete cascade,
  score int not null default 50 check (score between 0 and 100),
  timing text not null default 'Hold' check (timing in ('Now', 'Soon', 'Build first', 'Hold', 'Do not approach')),
  warmth text not null default 'Unknown' check (warmth in ('Hot', 'Warm', 'Known', 'Light', 'Cold', 'Unknown')),
  allocation text not null default 'Unallocated',
  pinned boolean not null default false,
  saved boolean not null default true,
  opening_angle text,
  benefit_to_them text,
  benefit_to_motion text,
  caution text,
  updated_by uuid references app_user (id),
  updated_at timestamptz not null default now()
);

create table relationships (
  id uuid primary key default gen_random_uuid(),
  from_kind entity_kind not null,
  from_id uuid not null,
  to_kind entity_kind not null,
  to_id uuid not null,
  relationship_type text not null,
  source text not null,
  confidence confidence_level not null default 'LOW',
  relationship_date date,
  last_verified date,
  notes text,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (from_id <> to_id)
);

create table source_adapters (
  id uuid primary key default gen_random_uuid(),
  source_name text not null unique,
  permitted_access_method text not null,
  access_type source_access_type not null,
  credentials_required text[] not null default '{}',
  rate_limits text,
  allowed_data text[] not null default '{}',
  prohibited_uses text[] not null default '{}',
  retention_restrictions text,
  last_successful_run timestamptz,
  errors text[] not null default '{}',
  status source_status not null default 'CONFIG_REQUIRED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table source_evidence (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid references source_adapters (id),
  source_url text,
  source_publisher text,
  source_date date,
  discovered_date date not null default current_date,
  last_checked date,
  extraction_method text not null,
  confidence confidence_level not null default 'LOW',
  exact_factual_claim text not null,
  raw_storage_path text,
  raw_retention_until date,
  created_at timestamptz not null default now()
);

alter table person_roles
  add constraint person_roles_source_evidence_fk
  foreign key (source_evidence_id) references source_evidence (id);

alter table person_skills
  add constraint person_skills_source_evidence_fk
  foreign key (source_evidence_id) references source_evidence (id);

create table relationship_evidence (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references relationships (id) on delete cascade,
  source_evidence_id uuid not null references source_evidence (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (relationship_id, source_evidence_id)
);

create table fit_scores (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  mission_relevance int not null check (mission_relevance between 0 and 100),
  community_credibility int not null check (community_credibility between 0 and 100),
  commercial_leverage int not null check (commercial_leverage between 0 and 100),
  foundation_relevance int not null check (foundation_relevance between 0 and 100),
  motion_brand_relevance int not null check (motion_brand_relevance between 0 and 100),
  product_relevance int not null check (product_relevance between 0 and 100),
  public_voice int not null check (public_voice between 0 and 100),
  network_proximity int not null check (network_proximity between 0 and 100),
  relationship_warmth_score int not null check (relationship_warmth_score between 0 and 100),
  approachability int not null check (approachability between 0 and 100),
  current_opportunity int not null check (current_opportunity between 0 and 100),
  evidence_confidence_score int not null check (evidence_confidence_score between 0 and 100),
  risk_sensitivity risk_level not null default 'LOW',
  recommended_motion_role text,
  recommended_foundation_role text,
  generated_by text not null,
  generated_at timestamptz not null default now(),
  source_evidence_ids uuid[] not null default '{}'
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  headline text not null,
  publisher text,
  url text not null,
  publication_date date,
  discovered_date date not null default current_date,
  original_summary text not null,
  topics text[] not null default '{}',
  countries text[] not null default '{}',
  why_it_may_matter text,
  source_confidence confidence_level not null default 'LOW',
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (url)
);

create table person_content_mentions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people (id) on delete cascade,
  content_item_id uuid not null references content_items (id) on delete cascade,
  mention_context text,
  confidence confidence_level not null default 'LOW',
  requires_review boolean not null default true,
  unique (person_id, content_item_id)
);

create table organisation_content_mentions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations (id) on delete cascade,
  content_item_id uuid not null references content_items (id) on delete cascade,
  mention_context text,
  confidence confidence_level not null default 'LOW',
  requires_review boolean not null default true,
  unique (organisation_id, content_item_id)
);

create table watch_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true,
  tier text not null default 'WATCHLIST_DAILY',
  queries text[] not null,
  daily_budget int not null default 20,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table watchlists (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  reason text,
  tier text not null default 'WATCHLIST_DAILY',
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opportunity_type text not null,
  urgency text not null check (urgency in ('HIGH', 'MEDIUM', 'LOW')),
  status opportunity_status not null default 'NEW',
  why_it_matters text not null,
  next_step text,
  related_people uuid[] not null default '{}',
  related_organisations uuid[] not null default '{}',
  source_evidence_ids uuid[] not null default '{}',
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references opportunities (id) on delete cascade,
  funder_organisation_id uuid references organisations (id),
  amount_min numeric,
  amount_max numeric,
  currency text,
  deadline date,
  eligibility_notes text,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  country text,
  city text,
  url text,
  notes text,
  source_evidence_id uuid references source_evidence (id),
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign_type text,
  owner_organisation_id uuid references organisations (id),
  url text,
  start_date date,
  end_date date,
  topics text[] not null default '{}',
  notes text,
  source_evidence_id uuid references source_evidence (id),
  created_at timestamptz not null default now()
);

create table outreach_plans (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete cascade,
  why_them text not null,
  best_relationship_type text,
  best_route text,
  warmest_introduction_path text[] not null default '{}',
  opening_angle text,
  motion_can_offer text,
  what_not_to_say text,
  timing text not null check (timing in ('NOW', 'SOON', 'BUILD_RELATIONSHIP_FIRST', 'HOLD', 'DO_NOT_APPROACH_YET')),
  requires_human_approval boolean not null default true,
  approved_by uuid references app_user (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((person_id is not null)::int + (organisation_id is not null)::int = 1)
);

create table outreach_activity (
  id uuid primary key default gen_random_uuid(),
  outreach_plan_id uuid references outreach_plans (id) on delete set null,
  person_id uuid references people (id) on delete cascade,
  organisation_id uuid references organisations (id) on delete cascade,
  activity_type text not null,
  status text not null,
  notes text,
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  check ((person_id is not null)::int + (organisation_id is not null)::int = 1)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  note_text text not null,
  visibility text not null default 'internal',
  created_by uuid references app_user (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table entity_tags (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entity_kind, entity_id, tag_id)
);

create table entity_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  alias text not null,
  source_evidence_id uuid references source_evidence (id),
  created_at timestamptz not null default now(),
  unique (entity_kind, entity_id, alias)
);

create table entity_merge_candidates (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_a_id uuid not null,
  entity_b_id uuid not null,
  score int not null check (score between 0 and 100),
  evidence_categories text[] not null default '{}',
  recommendation text not null default 'POSSIBLE_DUPLICATE_REVIEW',
  status text not null default 'pending',
  reviewed_by uuid references app_user (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (entity_a_id <> entity_b_id)
);

create table import_files (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid references source_adapters (id),
  original_filename text not null,
  storage_path text not null,
  content_hash text not null,
  imported_by uuid references app_user (id),
  imported_at timestamptz not null default now(),
  status text not null default 'uploaded',
  unique (content_hash)
);

create table import_rows (
  id uuid primary key default gen_random_uuid(),
  import_file_id uuid not null references import_files (id) on delete cascade,
  row_number int not null,
  raw_row jsonb not null,
  resolved_entity_kind entity_kind,
  resolved_entity_id uuid,
  resolution_status text not null default 'pending',
  resolution_notes text,
  created_at timestamptz not null default now(),
  unique (import_file_id, row_number)
);

create table scan_jobs (
  id uuid primary key default gen_random_uuid(),
  source_adapter_id uuid references source_adapters (id),
  watch_topic_id uuid references watch_topics (id),
  status scan_status not null default 'queued',
  priority int not null default 100,
  budget_limit int not null default 20,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text
);

create table scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_job_id uuid not null references scan_jobs (id) on delete cascade,
  source_url text not null,
  raw_result jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  content_item_id uuid references content_items (id),
  status text not null default 'new',
  created_at timestamptz not null default now(),
  unique (scan_job_id, dedupe_key)
);

create table change_events (
  id uuid primary key default gen_random_uuid(),
  entity_kind entity_kind not null,
  entity_id uuid not null,
  change_type text not null,
  change_summary text not null,
  source_evidence_id uuid references source_evidence (id),
  detected_at timestamptz not null default now(),
  new_since_last_scan boolean not null default true,
  reviewed_by uuid references app_user (id),
  reviewed_at timestamptz
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_user (id),
  action text not null,
  entity_kind entity_kind,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz not null default now()
);

create index people_search_idx on people using gin (search_vector);
create index people_name_trgm_idx on people using gin (full_name gin_trgm_ops);
create index organisations_search_idx on organisations using gin (search_vector);
create index organisations_name_trgm_idx on organisations using gin (name gin_trgm_ops);
create index content_items_search_idx on content_items using gin (to_tsvector('simple', headline || ' ' || original_summary));
create index content_embedding_idx on content_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index relationships_from_idx on relationships (from_kind, from_id);
create index relationships_to_idx on relationships (to_kind, to_id);
create index source_evidence_url_idx on source_evidence (source_url);
create index scan_jobs_status_idx on scan_jobs (status, priority, queued_at);
create index suppression_person_idx on suppression_list (person_id) where revoked_at is null;

alter table app_user enable row level security;
alter table workspace_membership enable row level security;
alter table people enable row level security;
alter table organisations enable row level security;
alter table privacy_status enable row level security;
alter table suppression_list enable row level security;
alter table social_accounts enable row level security;
alter table relationships enable row level security;
alter table source_evidence enable row level security;
alter table content_items enable row level security;
alter table opportunities enable row level security;
alter table outreach_plans enable row level security;
alter table audit_log enable row level security;

create policy "members can read people"
  on people for select
  using (exists (
    select 1 from workspace_membership wm
    where wm.user_id = auth.uid()
    and wm.status = 'active'
  ));

create policy "admins can write people"
  on people for all
  using (exists (
    select 1 from workspace_membership wm
    where wm.user_id = auth.uid()
    and wm.status = 'active'
    and wm.role in ('owner', 'admin', 'researcher')
  ))
  with check (exists (
    select 1 from workspace_membership wm
    where wm.user_id = auth.uid()
    and wm.status = 'active'
    and wm.role in ('owner', 'admin', 'researcher')
  ));

-- Apply equivalent read/write policies to other tables in the Supabase migration
-- set. They are kept explicit per table in production so privacy and outreach
-- tables can be made stricter than general research records.

create or replace function block_suppressed_outreach()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from suppression_list s
    where s.revoked_at is null
      and s.applies_to_outreach
      and (
        (new.person_id is not null and s.person_id = new.person_id)
        or (new.organisation_id is not null and s.organisation_id = new.organisation_id)
      )
  ) then
    raise exception 'Outreach is blocked by suppression list';
  end if;

  return new;
end;
$$;

create trigger trg_block_suppressed_outreach_plan
before insert or update on outreach_plans
for each row execute function block_suppressed_outreach();

create trigger trg_block_suppressed_outreach_activity
before insert or update on outreach_activity
for each row execute function block_suppressed_outreach();
