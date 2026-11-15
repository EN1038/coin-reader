-- Fix avatars storage RLS: upsert needs SELECT; use split_part for path check
begin;

drop policy if exists avatar_select on storage.objects;
create policy avatar_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists avatar_upload on storage.objects;
create policy avatar_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
    and name !~ '\.\.'
  );

drop policy if exists avatar_update on storage.objects;
create policy avatar_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

commit;
