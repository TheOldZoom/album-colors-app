create table if not exists artistes (
  id uuid primary key default gen_random_uuid(),
  name text,
  albums jsonb default '[]'::jsonb,
  user_id uuid default '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamptz default now(),
  updated_at timestamptz
);

alter table artistes enable row level security;

create policy "Public read access" on artistes
  for select using (true);

create policy "Insert access" on artistes
  for insert with check (true);

create policy "Update access" on artistes
  for update using (true);
