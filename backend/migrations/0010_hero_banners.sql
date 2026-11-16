-- Homepage hero banners managed from admin CMS
begin;

create table if not exists public.hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  alt text not null default '',
  image_url text not null,
  href text not null default '/discover',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.hero_banners enable row level security;

grant select on public.hero_banners to anon, authenticated;
grant insert, update, delete on public.hero_banners to authenticated, service_role;

drop policy if exists hero_banners_public_read on public.hero_banners;
create policy hero_banners_public_read on public.hero_banners
  for select to anon, authenticated
  using (active = true or auth.uid() is not null);

drop policy if exists hero_banners_auth_write on public.hero_banners;
create policy hero_banners_auth_write on public.hero_banners
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Optional denormalized bookmark count on works
alter table public.works
  add column if not exists bookmark_count integer not null default 0 check (bookmark_count >= 0);

commit;
