-- GCG Game Plan: Supabase setup. Run this once in the Supabase SQL Editor.
-- One table holds every document, addressed by a path such as "responses/<user id>".
-- Access rules mirror the Claude-hosted version: members write only their own documents, admins write everything.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

create or replace function public.gcg_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists gcg_on_signup on auth.users;
create trigger gcg_on_signup after insert on auth.users for each row execute function public.gcg_new_user();

create or replace function public.gcg_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table if not exists public.docs (
  path text primary key,
  col text generated always as (split_part(path, '/', 1)) stored,
  id text generated always as (split_part(path, '/', 2)) stored,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists docs_col_idx on public.docs (col);

alter table public.docs enable row level security;
alter table public.profiles enable row level security;

-- Collections only admins can read as a whole. Members read only the document named after themselves.
-- private: responses, ideas, acks, projects, projectmine, projectup
-- own-readable: responses, ideas, acks, projectmine, projectup (not projects)
drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs for select to authenticated using (
  public.gcg_is_admin()
  or col not in ('responses','ideas','acks','projects','projectmine','projectup')
  or (col in ('responses','ideas','acks','projectmine','projectup') and id = auth.uid()::text)
);

-- Writes: admins anywhere. Members: any document in replies, and only their own document in the collections below.
-- projectmine is admin-write only, as in the Claude-hosted version.
drop policy if exists docs_write on public.docs;
create policy docs_write on public.docs for all to authenticated
using (
  public.gcg_is_admin()
  or col = 'replies'
  or (col in ('responses','ideas','acks','people','crew','help','projectup') and id = auth.uid()::text)
)
with check (
  public.gcg_is_admin()
  or col = 'replies'
  or (col in ('responses','ideas','acks','people','crew','help','projectup') and id = auth.uid()::text)
);

-- Everyone signed in can read their own profile row. Only admins can change roles (done in the SQL editor).
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid() or public.gcg_is_admin());

grant select, insert, update, delete on public.docs to authenticated;
grant select on public.profiles to authenticated;

-- Live updates
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- After you have signed up once in the app, make yourself admin (replace the email):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
