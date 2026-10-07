-- Progetti dell'utente. kind = part (pezzo DXF) oppure profile (profilo del calcolatore).
-- user_id ha default auth.uid(): il client non lo invia.
-- revision cresce a ogni update e serve alla concorrenza ottimistica.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('part', 'profile')),
  name text not null check (char_length(name) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  schema_version integer not null check (schema_version >= 1),
  revision integer not null default 1 check (revision >= 1),
  data jsonb not null,
  units text check (units is null or units in ('mm', 'inch')),
  material_id text check (material_id is null or char_length(material_id) <= 80),
  thickness numeric,
  width numeric,
  height numeric,
  bend_count integer check (bend_count is null or bend_count >= 0),
  part_status text check (
    part_status is null or part_status in ('valid', 'incompleteForDomain', 'invalid')
  ),
  source_file_name text check (source_file_name is null or char_length(source_file_name) <= 255),
  source_path text check (source_path is null or char_length(source_path) <= 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_data_size check (pg_column_size(data) < 5242880)
);

create index projects_owner_updated_idx on public.projects (user_id, updated_at desc);

create or replace function public.protect_project_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'project id is immutable' using errcode = '42501';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'project owner is immutable' using errcode = '42501';
  end if;
  new.created_at = old.created_at;
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

create trigger projects_protect
  before update on public.projects
  for each row execute function public.protect_project_update();

alter table public.projects enable row level security;
alter table public.projects force row level security;

revoke all on table public.projects from anon, public;
revoke all on function public.protect_project_update() from public, anon, authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

create policy projects_select_own
  on public.projects
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy projects_insert_own
  on public.projects
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy projects_update_own
  on public.projects
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy projects_delete_own
  on public.projects
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
