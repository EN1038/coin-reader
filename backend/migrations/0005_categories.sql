-- Categories managed by admin (name + icon_key for SVG mapping on the client)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon_key text not null default 'book'
    check (icon_key in ('book','zap','sparkles','heart','ghost','masks','rocket','search')),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx
  on public.categories (active, sort_order, name);

alter table public.categories enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (active = true);

-- Seed defaults (idempotent by slug)
insert into public.categories (name, slug, icon_key, sort_order, active) values
  ('โรแมนติก', 'romance', 'heart', 1, true),
  ('แฟนตาซี', 'fantasy', 'sparkles', 2, true),
  ('สยองขวัญ', 'horror', 'ghost', 3, true),
  ('ดราม่า', 'drama', 'masks', 4, true),
  ('แอ็กชัน', 'action', 'zap', 5, true),
  ('ไซไฟ', 'sci-fi', 'rocket', 6, true),
  ('ลึกลับ', 'mystery', 'search', 7, true)
on conflict (slug) do nothing;
