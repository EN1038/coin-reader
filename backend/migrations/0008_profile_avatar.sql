-- Profile avatar URL + public storage bucket for user photos
begin;

alter table public.profiles
  add column if not exists avatar_url text;

-- Allow self-service update of display name + avatar
grant update(display_name, avatar_url) on public.profiles to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Own folder only: {user_id}/avatar.*
drop policy if exists avatar_upload on storage.objects;
create policy avatar_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name !~ '\.\.'
  );

drop policy if exists avatar_update on storage.objects;
create policy avatar_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
