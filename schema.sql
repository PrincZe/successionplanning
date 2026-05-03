-- Create officers table first since it's referenced by positions table
create table officers (
  officer_id varchar primary key,
  name varchar not null,
  mx_equivalent_grade varchar,
  grade varchar,
  ihrp_certification varchar,
  hrlp varchar,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create positions table
create table positions (
  position_id varchar primary key,
  position_title varchar not null,
  agency varchar not null,
  jr_grade varchar not null,
  incumbent_id varchar references officers(officer_id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create hr_competencies table
create table hr_competencies (
  competency_id serial primary key,
  competency_name varchar not null,
  description text,
  max_pl_level integer not null default 5
);

-- Create position_successors table
create table position_successors (
  position_id varchar references positions(position_id),
  successor_id varchar references officers(officer_id),
  succession_type varchar check (succession_type in ('immediate', '1-2_years', '3-5_years', 'more_than_5_years')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (position_id, successor_id, succession_type)
);

-- Create officer_competencies table
create table officer_competencies (
  officer_id varchar references officers(officer_id),
  competency_id integer references hr_competencies(competency_id),
  achieved_pl_level integer check (achieved_pl_level between 1 and 5),
  assessment_date date not null,
  primary key (officer_id, competency_id)
);

-- Create ooa_stints table
create table ooa_stints (
  stint_id serial primary key,
  stint_name varchar not null,
  stint_type varchar not null,
  year integer not null
);

-- Create officer_stints table
create table officer_stints (
  officer_id varchar references officers(officer_id),
  stint_id integer references ooa_stints(stint_id),
  completion_year integer not null,
  primary key (officer_id, stint_id)
);

-- Create officer_remarks table
create table officer_remarks (
  remark_id serial primary key,
  officer_id varchar references officers(officer_id),
  remark_date date not null,
  place varchar not null,
  details text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================================================
-- Phase 2: Pipeline Strength scoring foundation
-- =============================================================================

-- What each role requires
create table position_required_competencies (
  position_id varchar references positions(position_id) on delete cascade,
  competency_id integer references hr_competencies(competency_id),
  required_pl_level integer not null check (required_pl_level between 1 and 5),
  weight numeric not null default 1.0 check (weight > 0),
  primary key (position_id, competency_id)
);

-- Incumbent risk: when does the current holder likely vacate
create table incumbent_risk (
  position_id varchar primary key references positions(position_id) on delete cascade,
  risk_horizon_months integer not null check (risk_horizon_months >= 0),
  risk_reason text,
  updated_at timestamptz not null default now()
);

-- CHROO criteria as editable JSONB config (tune without code change)
create table pipeline_criteria (
  criterion_key varchar primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- AI-extracted qualitative signals from officer_remarks (cached)
create table officer_qualitative_signals (
  officer_id varchar primary key references officers(officer_id) on delete cascade,
  endorsement_count integer not null default 0,
  endorsement_specificity_score numeric not null default 0,
  endorsement_seniority_score numeric not null default 0,
  domain_match_keywords text[] not null default '{}',
  concerns_count integer not null default 0,
  sentiment_trajectory varchar check (sentiment_trajectory in ('improving','stable','declining','unknown')),
  qualitative_score numeric not null default 0,
  signals jsonb,
  source_remark_ids integer[] not null default '{}',
  generated_at timestamptz not null default now(),
  generation_method varchar not null default 'ai' check (generation_method in ('mock','ai'))
);

-- Cached pipeline assessments (dashboard reads from here, not live compute)
create table pipeline_assessments (
  position_id varchar primary key references positions(position_id) on delete cascade,
  overall_score numeric not null,
  overall_band varchar not null check (overall_band in ('green','amber','red')),
  sub_scores jsonb not null,
  reasons jsonb not null,
  ai_narration text,
  ai_interventions jsonb,
  computed_at timestamptz not null default now()
);

alter table position_required_competencies enable row level security;
alter table incumbent_risk enable row level security;
alter table pipeline_criteria enable row level security;
alter table officer_qualitative_signals enable row level security;
alter table pipeline_assessments enable row level security;

create index idx_prc_position on position_required_competencies(position_id);
create index idx_prc_competency on position_required_competencies(competency_id);
create index idx_pa_band on pipeline_assessments(overall_band);
create index idx_pa_score on pipeline_assessments(overall_score);

-- =============================================================================
-- Phase 6: Successor Recommender foundation
-- =============================================================================

-- What officers want next: target position, grade, or domain. Many per officer.
create table officer_aspirations (
  aspiration_id serial primary key,
  officer_id varchar not null references officers(officer_id) on delete cascade,
  target_position_id varchar references positions(position_id) on delete set null,
  target_jr_grade varchar,
  target_domain varchar,
  notes text,
  updated_at timestamptz not null default now()
);

-- Whether an officer is currently a viable successor candidate. One per officer.
create table officer_availability (
  officer_id varchar primary key references officers(officer_id) on delete cascade,
  status varchar not null default 'available'
    check (status in ('available','recently_placed','on_leave','flight_risk')),
  available_from date,
  notes text,
  updated_at timestamptz not null default now()
);

-- Cached AI-reranked successor recommendations (UI reads from here)
create table successor_recommendations (
  position_id varchar primary key references positions(position_id) on delete cascade,
  candidates jsonb not null,
  generated_at timestamptz not null default now(),
  generation_method varchar not null default 'ai' check (generation_method in ('engine','ai'))
);

alter table officer_aspirations enable row level security;
alter table officer_availability enable row level security;
alter table successor_recommendations enable row level security;

create index idx_aspirations_officer on officer_aspirations(officer_id);
create index idx_aspirations_target_position on officer_aspirations(target_position_id);
create index idx_availability_status on officer_availability(status);
