-- Create allowed_emails table
create table if not exists allowed_emails (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table allowed_emails enable row level security;

-- Create policies
create policy "Allow service role to manage allowed_emails"
on allowed_emails for all
using (auth.jwt() ->> 'role' = 'service_role')
with check (auth.jwt() ->> 'role' = 'service_role');

-- Create policy to allow anyone to read allowed_emails
create policy "Allow public to read allowed_emails"
on allowed_emails for select
using (true);

-- Insert initial allowed emails
insert into allowed_emails (email) values
  ('silent_will7@hotmail.com'),
  ('user1@tech.gov.sg'),
  ('user2@psd.gov.sg')
on conflict (email) do nothing; 