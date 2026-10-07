-- Bucket privato per il solo DXF originale. Il DXF modificato si rigenera dal Part.
-- Path obbligatorio: {user_id}/{project_id}/source.dxf

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  10485760,
  array['application/dxf', 'image/vnd.dxf', 'application/octet-stream', 'text/plain']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.owns_project_file(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public, storage
as $$
  select
    (storage.foldername(object_name))[1] = (select auth.uid())::text
    and object_name = (storage.foldername(object_name))[1]
      || '/'
      || (storage.foldername(object_name))[2]
      || '/source.dxf'
    and exists (
      select 1
      from public.projects as project
      where project.id::text = (storage.foldername(object_name))[2]
        and project.user_id = (select auth.uid())
    );
$$;

revoke all on function private.owns_project_file(text) from public, anon;
grant execute on function private.owns_project_file(text) to authenticated;

create policy project_files_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and private.owns_project_file(name)
  );

create policy project_files_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and private.owns_project_file(name)
  );

create policy project_files_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and private.owns_project_file(name)
  )
  with check (
    bucket_id = 'project-files'
    and private.owns_project_file(name)
  );

create policy project_files_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and private.owns_project_file(name)
  );
