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
  succession_type varchar check (succession_type in ('immediate', '1-2_years', '3-5_years')),
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