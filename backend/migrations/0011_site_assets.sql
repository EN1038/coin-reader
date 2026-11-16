-- CMS-managed default brand / placeholder images
begin;

create table if not exists public.site_assets (
  key text primary key,
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_assets enable row level security;

grant select on public.site_assets to anon, authenticated;
grant insert, update, delete on public.site_assets to authenticated, service_role;

drop policy if exists site_assets_public_read on public.site_assets;
create policy site_assets_public_read on public.site_assets
  for select to anon, authenticated
  using (true);

drop policy if exists site_assets_auth_write on public.site_assets;
create policy site_assets_auth_write on public.site_assets
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

commit;
