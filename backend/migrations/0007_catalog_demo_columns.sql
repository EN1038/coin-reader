-- Catalog display columns so realApi can serve the same Work shape as mock seed
begin;

alter table public.works
  add column if not exists cover_tone text not null default 'default'
    check (cover_tone in ('default', 'warm', 'teal', 'rose', 'blue')),
  add column if not exists cover_url text,
  add column if not exists author_name text not null default '',
  add column if not exists chapter_count integer not null default 0 check (chapter_count >= 0),
  add column if not exists views integer not null default 0 check (views >= 0),
  add column if not exists score numeric(3, 2) not null default 0 check (score >= 0 and score <= 5),
  add column if not exists rating_count integer not null default 0 check (rating_count >= 0),
  add column if not exists rank_daily integer not null default 0,
  add column if not exists rank_weekly integer not null default 0,
  add column if not exists rank_monthly integer not null default 0,
  add column if not exists latest_at timestamptz,
  add column if not exists featured boolean not null default false,
  add column if not exists popular boolean not null default false,
  add column if not exists is_new boolean not null default false,
  add column if not exists is_example_data boolean not null default false;

-- Expand category icons used by the bilingual catalog seed
alter table public.categories drop constraint if exists categories_icon_key_check;
alter table public.categories
  add constraint categories_icon_key_check
  check (icon_key in ('book', 'zap', 'sparkles', 'heart', 'ghost', 'masks', 'rocket', 'search'));

grant select on public.categories to anon, authenticated, service_role;
grant insert, update, delete on public.categories to service_role;

commit;
