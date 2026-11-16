-- Stock Manga · draft dual currency (Gold reader / Diamond translator)
-- Mock client is source of truth for demo; this migration prepares schema for later RPCs.

alter table if exists public.coin_ledger
  add column if not exists currency text not null default 'gold'
  check (currency in ('gold', 'diamond'));

comment on column public.coin_ledger.currency is
  'gold = reader spendable; diamond = translator earnings';

-- Optional future wallet view helpers (not wired to edge yet):
-- create or replace function public.wallet_gold(uid uuid) ...
-- create or replace function public.wallet_diamond(uid uuid) ...

update public.platform_settings
set writer_share_bps = 9000
where coalesce(writer_share_bps, 0) = 7000;
