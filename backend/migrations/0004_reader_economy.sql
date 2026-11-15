-- Twilight Blue reader economy · 8 พ.ย. 2569 / 2026-11-08 (Asia/Bangkok)
-- ตารางและตัวกัน append-only สำหรับเช็คอิน ตั๋วอ่านฟรี แนะนำเพื่อน ทิป คอมเมนต์ และเรต
-- ยังไม่มี RPC ลงบัญชีเหล่านี้: client mock เป็นตัวที่เดิน flow; client ห้ามเขียน ledger/ตั๋ว/เช็คอินเอง
begin;

alter type public.transaction_kind add value if not exists 'check_in';
alter type public.transaction_kind add value if not exists 'referral_reward';
alter type public.transaction_kind add value if not exists 'tip';
alter type public.account_kind add value if not exists 'promo_clearing';

alter table public.works
  add column free_episode_count integer not null default 0 check (free_episode_count >= 0);
alter table public.chapters
  add column follow_to_read boolean not null default false;
alter table public.coin_packs
  add column bonus_coins integer not null default 0 check (bonus_coins >= 0);
alter table public.platform_settings
  add column referral_bps integer not null default 700 check (referral_bps between 0 and 10000);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  claim_date date not null,
  coins integer not null check (coins > 0),
  tickets integer not null check (tickets >= 0),
  transaction_id uuid references public.ledger_transactions(id),
  created_at timestamptz not null default now(),
  unique (user_id, claim_date)
);
create table public.ticket_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  amount integer not null check (amount <> 0),
  reason text not null check (reason in ('check_in', 'month_end', 'unlock')),
  chapter_id uuid references public.chapters(id),
  transaction_id uuid references public.ledger_transactions(id),
  created_at timestamptz not null default now()
);
create table public.referral_codes (
  user_id uuid primary key references public.profiles(id),
  code text not null unique check (code ~ '^[A-Z0-9]{4,16}$'),
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (referred_by is null or referred_by <> user_id)
);
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id),
  referee_id uuid not null references public.profiles(id),
  source_transaction_id uuid not null unique references public.ledger_transactions(id),
  paid_coins integer not null check (paid_coins > 0),
  reward_coins integer not null check (reward_coins > 0),
  transaction_id uuid not null unique references public.ledger_transactions(id),
  created_at timestamptz not null default now(),
  check (referrer_id <> referee_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  user_id uuid not null references public.profiles(id),
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table public.comment_likes (
  comment_id uuid not null references public.comments(id),
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create table public.work_ratings (
  user_id uuid not null references public.profiles(id),
  work_id uuid not null references public.works(id),
  stars integer not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, work_id)
);

create index check_ins_user on public.check_ins (user_id, claim_date desc);
create index ticket_ledger_user on public.ticket_ledger (user_id, created_at);
create index comments_chapter on public.comments (chapter_id, created_at desc);
create index work_ratings_work on public.work_ratings (work_id);

alter table public.check_ins enable row level security;
alter table public.ticket_ledger enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.work_ratings enable row level security;

create trigger check_ins_immutable before update or delete on public.check_ins
  for each row execute function public.reject_mutation();
create trigger check_ins_no_truncate before truncate on public.check_ins
  for each statement execute function public.reject_mutation();
create trigger ticket_ledger_immutable before update or delete on public.ticket_ledger
  for each row execute function public.reject_mutation();
create trigger ticket_ledger_no_truncate before truncate on public.ticket_ledger
  for each statement execute function public.reject_mutation();
create trigger referral_rewards_immutable before update or delete on public.referral_rewards
  for each row execute function public.reject_mutation();
create trigger referral_rewards_no_truncate before truncate on public.referral_rewards
  for each statement execute function public.reject_mutation();

create function public.reject_negative_tickets() returns trigger
language plpgsql security definer set search_path='' as $$
declare b integer;
begin
  perform 1 from public.profiles where id = new.user_id for update;
  select coalesce(sum(amount), 0) into b from public.ticket_ledger where user_id = new.user_id;
  if b + new.amount < 0 then
    raise exception 'NO_TICKET' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger ticket_nonnegative before insert on public.ticket_ledger
  for each row execute function public.reject_negative_tickets();

revoke all on function public.reject_negative_tickets() from public, anon, authenticated, service_role;

grant select on public.check_ins, public.ticket_ledger, public.referral_codes, public.referral_rewards to authenticated;
grant select on public.comments, public.comment_likes, public.work_ratings to anon, authenticated;
grant insert on public.comments to authenticated;
grant insert, delete on public.comment_likes to authenticated;
grant insert, update on public.work_ratings to authenticated;
grant select on public.check_ins, public.ticket_ledger, public.referral_codes, public.referral_rewards, public.comments, public.comment_likes, public.work_ratings to service_role;

create policy check_ins_self on public.check_ins for select to authenticated using (user_id = auth.uid());
create policy ticket_ledger_self on public.ticket_ledger for select to authenticated using (user_id = auth.uid());
create policy referral_codes_self on public.referral_codes for select to authenticated using (user_id = auth.uid());
create policy referral_rewards_self on public.referral_rewards for select to authenticated
  using (referrer_id = auth.uid() or referee_id = auth.uid());
create policy comments_read on public.comments for select to anon, authenticated
  using (public.can_read_chapter(chapter_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.can_read_chapter(chapter_id));
create policy comment_likes_read on public.comment_likes for select to anon, authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id and public.can_read_chapter(c.chapter_id)));
create policy comment_likes_write on public.comment_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy comment_likes_delete on public.comment_likes for delete to authenticated
  using (user_id = auth.uid());
create policy work_ratings_read on public.work_ratings for select to anon, authenticated
  using (exists (select 1 from public.works w where w.id = work_id and w.status = 'published'));
create policy work_ratings_insert on public.work_ratings for insert to authenticated
  with check (user_id = auth.uid());
create policy work_ratings_update on public.work_ratings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
