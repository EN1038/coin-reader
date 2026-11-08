-- Coin Reader · 6 พ.ย. 2569 / 2026-11-06 (Asia/Bangkok)
-- แบบ MVP mock-only; ไม่ใช่บัญชีเงินบาทจริง / ไม่มี VIP และ refund
begin;
create type public.author_status as enum ('pending','approved','rejected','suspended');
create type public.work_kind as enum ('novel','manga');
create type public.content_status as enum ('draft','published','suspended','takedown');
create type public.content_rating as enum ('general','18+');
create type public.pricing_kind as enum ('free','coin');
create type public.account_kind as enum ('wallet','clearing','writer_payable','platform_revenue','adjustment_clearing','payout_clearing');
create type public.transaction_kind as enum ('mock_topup','chapter_unlock','work_unlock','admin_adjustment','mock_payout');
create type public.case_status as enum ('open','reviewing','resolved','rejected');
create type public.payout_status as enum ('pending','approved','paid','rejected','cancelled');

-- auth.users เป็นผู้ใช้จริง; public ไม่เก็บอีเมลซ้ำ
create table public.profiles (
 id uuid primary key references auth.users(id), display_name text not null default '' check(length(display_name)<=80),
 status text not null default 'active' check(status in ('active','suspended','closed')),
 watermark_id uuid not null unique default gen_random_uuid(), created_at timestamptz not null default now()
);
create table public.app_admins (
 user_id uuid primary key references public.profiles(id), role text not null check(role in ('moderator','finance','superadmin'))
);
create function public.is_admin(p_role text default null) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_admins a where a.user_id=auth.uid() and (p_role is null or a.role=p_role or a.role='superadmin'));
$$;
create table public.platform_settings (
 singleton boolean primary key default true check(singleton), writer_share_bps integer not null check(writer_share_bps between 0 and 10000),
 hold_days integer not null check(hold_days between 0 and 365), minimum_payout numeric(18,2) not null check(minimum_payout>0),
 mock_enabled boolean not null default false, is_example_data boolean not null default true,
 note text not null, updated_at timestamptz not null default now()
);
create table public.authors (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id),
 display_name text not null check(length(display_name) between 1 and 80), bio text check(length(bio)<=2000),
 status public.author_status not null default 'pending', contract_version text not null check(length(contract_version) between 1 and 80),
 contract_accepted_at timestamptz not null default now(), approved_at timestamptz,
 created_at timestamptz not null default now(), check(status<>'approved' or approved_at is not null)
);
create table public.author_documents (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.authors(id),
 kind text not null check(kind in ('identity','bank','rights')), storage_path text not null unique,
 verified_at timestamptz, retention_until timestamptz, created_at timestamptz not null default now(),
 check(storage_path !~ '(^/|\.\.)')
);
create table public.works (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.authors(id), kind public.work_kind not null,
 title text not null check(length(title) between 1 and 200), slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{0,159}$'),
 synopsis text not null default '' check(length(synopsis)<=10000), cover_path text, category text, tags text[] not null default '{}',
 rating public.content_rating not null default 'general', status public.content_status not null default 'draft',
 price_full_work integer check(price_full_work>0), completed boolean not null default false,
 published_at timestamptz, created_at timestamptz not null default now(), check(status<>'published' or published_at is not null)
);
create index works_catalog on public.works(status,published_at desc);
create index works_author on public.works(author_id);
create table public.chapters (
 id uuid primary key default gen_random_uuid(), work_id uuid not null references public.works(id), number integer not null check(number>0),
 title text not null check(length(title) between 1 and 200), pricing public.pricing_kind not null,
 coin_price integer not null default 0, status public.content_status not null default 'draft', publish_at timestamptz,
 content_type public.work_kind not null, created_at timestamptz not null default now(), unique(work_id,number), unique(id,work_id),
 check((pricing='free' and coin_price=0) or (pricing='coin' and coin_price>0)),
 check(status<>'published' or publish_at is not null)
);
create index chapters_release on public.chapters(work_id,status,publish_at);
-- แยก body จาก metadata ป้องกัน paid body หลุดจากสารบัญ
create table public.chapter_contents (
 chapter_id uuid primary key references public.chapters(id), body text not null check(length(body)<=1000000)
);
create table public.chapter_pages (
 id uuid primary key default gen_random_uuid(), chapter_id uuid not null references public.chapters(id),
 page_number integer not null check(page_number>0), storage_path text not null unique,
 unique(chapter_id,page_number), check(storage_path !~ '(^/|\.\.)')
);
create table public.coin_packs (
 id uuid primary key default gen_random_uuid(), name text not null, coins integer not null check(coins>0),
 amount_thb numeric(12,2) not null check(amount_thb>0), active boolean not null default true, is_example_data boolean not null default true
);
create table public.ledger_transactions (
 id uuid primary key default gen_random_uuid(), kind public.transaction_kind not null, actor_id uuid references public.profiles(id),
 reason text, created_at timestamptz not null default now(),
 check(kind<>'admin_adjustment' or (reason is not null and length(trim(reason)) between 10 and 1000))
);
create table public.coin_ledger (
 id bigint generated always as identity primary key, transaction_id uuid not null references public.ledger_transactions(id),
 account public.account_kind not null, user_id uuid references public.profiles(id), author_id uuid references public.authors(id),
 amount numeric(18,2) not null check(amount<>0), created_at timestamptz not null default now(),
 check((account='wallet' and user_id is not null and author_id is null and amount=trunc(amount))
 or (account='writer_payable' and author_id is not null and user_id is null)
 or (account not in ('wallet','writer_payable') and user_id is null and author_id is null))
);
create index ledger_wallet on public.coin_ledger(user_id,id) where account='wallet';
create index ledger_writer on public.coin_ledger(author_id,created_at) where account='writer_payable';
create index ledger_transaction on public.coin_ledger(transaction_id);
create table public.mock_payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), pack_id uuid not null references public.coin_packs(id),
 client_request_id uuid not null, provider text not null default 'mock' check(provider='mock'),
 provider_event_id text not null unique, provider_ref text not null unique,
 status text not null default 'succeeded' check(status='succeeded'), coins integer not null check(coins>0),
 amount_thb numeric(12,2) not null check(amount_thb>0), transaction_id uuid not null unique references public.ledger_transactions(id),
 is_example_data boolean not null default true check(is_example_data), created_at timestamptz not null default now(), unique(user_id,client_request_id)
);
create table public.work_purchases (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), work_id uuid not null references public.works(id),
 transaction_id uuid not null unique references public.ledger_transactions(id), coins integer not null check(coins>0),
 created_at timestamptz not null default now(), unique(user_id,work_id)
);
create table public.unlocks (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), chapter_id uuid not null,
 work_id uuid not null, transaction_id uuid not null references public.ledger_transactions(id),
 source text not null check(source in ('chapter','work')), created_at timestamptz not null default now(),
 foreign key(chapter_id,work_id) references public.chapters(id,work_id), unique(user_id,chapter_id)
);
create index unlocks_work on public.unlocks(user_id,work_id);
create table public.bookshelf (
 user_id uuid not null references public.profiles(id), work_id uuid not null references public.works(id),
 created_at timestamptz not null default now(), primary key(user_id,work_id)
);
create table public.reading_progress (
 user_id uuid not null references public.profiles(id), work_id uuid not null references public.works(id), chapter_id uuid not null,
 position numeric(6,5) not null check(position between 0 and 1), updated_at timestamptz not null default now(),
 primary key(user_id,work_id), foreign key(chapter_id,work_id) references public.chapters(id,work_id)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id),
 work_id uuid references public.works(id), chapter_id uuid references public.chapters(id), target_user_id uuid references public.profiles(id),
 reason text not null check(length(reason) between 10 and 2000), status public.case_status not null default 'open',
 created_at timestamptz not null default now(), check(num_nonnulls(work_id,chapter_id,target_user_id)=1)
);
create table public.takedown_requests (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id), work_id uuid not null references public.works(id),
 claim text not null check(length(claim) between 20 and 5000), evidence_path text not null,
 status public.case_status not null default 'open', admin_notes text, created_at timestamptz not null default now()
);
create index reports_queue on public.reports(status,created_at);
create index takedown_queue on public.takedown_requests(status,created_at);
create table public.payout_requests (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.authors(id), amount numeric(18,2) not null check(amount>0),
 bank_document_id uuid not null references public.author_documents(id), status public.payout_status not null default 'pending',
 admin_notes text, client_request_id uuid not null, transaction_id uuid unique references public.ledger_transactions(id),
 is_example_data boolean not null default true check(is_example_data), created_at timestamptz not null default now(), paid_at timestamptz,
 unique(author_id,client_request_id), check((status='paid')=(transaction_id is not null and paid_at is not null))
);
create index payouts_queue on public.payout_requests(author_id,status,created_at);
create table public.audit_log (
 id bigint generated always as identity primary key, actor_id uuid references public.profiles(id),
 action text not null, target_table text not null, target_id text, before_data jsonb, after_data jsonb,
 created_at timestamptz not null default now()
);

-- helper ใช้ search_path ว่าง / qualify ทุก object; ไม่เชื่อ role ใน user_metadata
create function public.owns_work(p_work uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.works w join public.authors a on a.id=w.author_id join public.profiles p on p.id=a.user_id where w.id=p_work and a.user_id=auth.uid() and a.status='approved' and p.status='active');
$$;
create function public.work_visible(p_work uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.works w join public.authors a on a.id=w.author_id join public.profiles p on p.id=a.user_id where w.id=p_work and p.status='active' and w.status='published'
 and w.published_at<=now() and w.rating='general' and a.status='approved');
$$;
create function public.chapter_visible(p_chapter uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chapters c where c.id=p_chapter and c.status='published' and c.publish_at<=now() and public.work_visible(c.work_id));
$$;
create function public.can_read_chapter(p_chapter uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.chapters c where c.id=p_chapter and public.chapter_visible(c.id)
 and (c.pricing='free' or (exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active')
 and exists(select 1 from public.unlocks u where u.user_id=auth.uid() and u.chapter_id=c.id))));
$$;
create function public.wallet_balance(p_user uuid) returns numeric language sql stable security definer set search_path='' as $$
 select coalesce(sum(amount),0) from public.coin_ledger where account='wallet' and user_id=p_user;
$$;
create function public.my_wallet() returns numeric language sql stable security definer set search_path='' as $$ select public.wallet_balance(auth.uid()); $$;
create function public.on_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin insert into public.profiles(id) values(new.id); return new; end; $$;
create trigger create_profile after insert on auth.users for each row execute function public.on_auth_user();

-- บัญชีห้ามแก้ย้อนหลัง รวมถึง service_role (owner SQL ยังต้อง governance แยก)
create function public.reject_mutation() returns trigger language plpgsql set search_path='' as $$
 begin raise exception 'APPEND_ONLY' using errcode='23514'; end; $$;
do $$ declare t text; begin foreach t in array array['coin_ledger','ledger_transactions','mock_payments','unlocks','work_purchases','audit_log'] loop
 execute format('create trigger immutable_rows before update or delete on public.%I for each row execute function public.reject_mutation()',t);
 execute format('create trigger immutable_truncate before truncate on public.%I for each statement execute function public.reject_mutation()',t);
 end loop; end $$;
create function public.check_balanced() returns trigger language plpgsql security definer set search_path='' as $$
 declare n bigint; s numeric; k uuid; begin
 if tg_table_name='ledger_transactions' then k:=new.id; else k:=new.transaction_id; end if;
 select count(*),coalesce(sum(amount),0) into n,s from public.coin_ledger where transaction_id=k;
 if n<2 or s<>0 then raise exception 'UNBALANCED_TRANSACTION' using errcode='23514'; end if;
 return null; end; $$;
create constraint trigger transaction_balanced after insert on public.ledger_transactions deferrable initially deferred for each row execute function public.check_balanced();
create constraint trigger entries_balanced after insert on public.coin_ledger deferrable initially deferred for each row execute function public.check_balanced();
-- ไม่อนุญาตเติมแถวเข้า transaction เก่า (sealed at commit ด้วย xid)
alter table public.ledger_transactions add column creation_xid xid8 not null default pg_current_xact_id();
create function public.check_ledger_insert() returns trigger language plpgsql security definer set search_path='' as $$
 declare b numeric; begin
 if not exists(select 1 from public.ledger_transactions where id=new.transaction_id and creation_xid=pg_current_xact_id()) then
 raise exception 'TRANSACTION_SEALED' using errcode='23514'; end if;
 if new.account='wallet' then
 perform 1 from public.profiles where id=new.user_id for update;
 b:=public.wallet_balance(new.user_id)+new.amount;
 if b<0 then raise exception 'INSUFFICIENT_COINS' using errcode='P0001'; end if;
 end if; return new; end; $$;
create trigger ledger_insert_guard before insert on public.coin_ledger for each row execute function public.check_ledger_insert();

-- บันทึก service/admin writes อัตโนมัติ; ไม่คัดลอก KYC/body/PII ลง audit
create function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
 declare b jsonb; a jsonb; begin
 if tg_op<>'INSERT' then b:=to_jsonb(old); end if;
 if tg_op<>'DELETE' then a:=to_jsonb(new); end if;
 insert into public.audit_log(actor_id,action,target_table,target_id,before_data,after_data)
 values(auth.uid(),tg_op,tg_table_name,coalesce(a->>'id',b->>'id',a->>'user_id',b->>'user_id', 'singleton'),
 case when tg_table_name in ('author_documents','takedown_requests','reports','profiles','authors','payout_requests','works','chapters') then jsonb_build_object('status',b->'status','amount',b->'amount') else b end,
 case when tg_table_name in ('author_documents','takedown_requests','reports','profiles','authors','payout_requests','works','chapters') then jsonb_build_object('status',a->'status','amount',a->'amount') else a end);
 if tg_op='DELETE' then return old; else return new; end if; end; $$;
do $$ declare t text; begin foreach t in array array['app_admins','platform_settings','authors','author_documents','works','chapters','reports','takedown_requests','payout_requests','profiles','coin_packs'] loop
 execute format('create trigger audit_write after insert or update or delete on public.%I for each row execute function public.audit_change()',t);
 end loop; end $$;

-- topup เรียกได้เฉพาะ service หลัง Edge ตรวจ JWT; lock ก่อนตรวจ idempotency
create function public.mock_topup(p_user uuid,p_pack uuid,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
 declare pay public.mock_payments; pack public.coin_packs; tx uuid; begin
 perform 1 from public.profiles where id=p_user and status='active' for update;
 if not found then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
 select * into pay from public.mock_payments where user_id=p_user and client_request_id=p_request;
 if found then
 if pay.pack_id<>p_pack then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
 return jsonb_build_object('payment_id',pay.id,'transaction_id',pay.transaction_id,'balance',public.wallet_balance(p_user),'replayed',true,'mock',true); end if;
 if not exists(select 1 from public.platform_settings where mock_enabled) then raise exception 'MOCK_DISABLED'; end if;
 select * into pack from public.coin_packs where id=p_pack and active for share;
 if not found then raise exception 'PACK_NOT_FOUND'; end if;
 insert into public.ledger_transactions(kind,actor_id) values('mock_topup',p_user) returning id into tx;
 insert into public.coin_ledger(transaction_id,account,amount) values(tx,'clearing',-pack.coins);
 insert into public.coin_ledger(transaction_id,account,user_id,amount) values(tx,'wallet',p_user,pack.coins);
 insert into public.mock_payments(user_id,pack_id,client_request_id,provider_event_id,provider_ref,coins,amount_thb,transaction_id)
 values(p_user,p_pack,p_request,'mock:'||p_user||':'||p_request,'mock:'||tx,pack.coins,pack.amount_thb,tx) returning * into pay;
 return jsonb_build_object('payment_id',pay.id,'transaction_id',tx,'balance',public.wallet_balance(p_user),'replayed',false,'mock',true);
 end; $$;

-- ทั้งสอง RPC serialize บน profile เดียวกัน → topup/unlock/adjustment ไม่ชนยอด
create function public.unlock_chapter(p_chapter uuid,p_expected_price integer) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid:=auth.uid(); c public.chapters; w public.works; tx uuid; share integer; writer numeric; begin
 perform 1 from public.profiles where id=u and status='active' for update;
 if not found then raise exception 'LOGIN_REQUIRED'; end if;
 select * into c from public.chapters where id=p_chapter for share;
 if not found then raise exception 'CHAPTER_UNAVAILABLE'; end if;
 select * into w from public.works where id=c.work_id for share;
 if not public.chapter_visible(c.id) then raise exception 'CHAPTER_UNAVAILABLE'; end if;
 select transaction_id into tx from public.unlocks where user_id=u and chapter_id=c.id;
 if found then return jsonb_build_object('transaction_id',tx,'balance',public.wallet_balance(u),'replayed',true); end if;
 if c.pricing='free' then return jsonb_build_object('free',true,'balance',public.wallet_balance(u),'replayed',true); end if;
 if p_expected_price is null or p_expected_price<>c.coin_price then raise exception 'PRICE_CHANGED'; end if;
 if public.wallet_balance(u)<c.coin_price then raise exception 'INSUFFICIENT_COINS'; end if;
 select writer_share_bps into strict share from public.platform_settings;
 writer:=round(c.coin_price::numeric*share/10000,2);
 insert into public.ledger_transactions(kind,actor_id) values('chapter_unlock',u) returning id into tx;
 insert into public.coin_ledger(transaction_id,account,user_id,amount) values(tx,'wallet',u,-c.coin_price);
 if writer>0 then insert into public.coin_ledger(transaction_id,account,author_id,amount) values(tx,'writer_payable',w.author_id,writer); end if;
 if writer<c.coin_price then insert into public.coin_ledger(transaction_id,account,amount) values(tx,'platform_revenue',c.coin_price-writer); end if;
 insert into public.unlocks(user_id,chapter_id,work_id,transaction_id,source) values(u,c.id,w.id,tx,'chapter');
 return jsonb_build_object('transaction_id',tx,'balance',public.wallet_balance(u),'replayed',false);
 end; $$;
create function public.unlock_work(p_work uuid,p_expected_price integer) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid:=auth.uid(); w public.works; tx uuid; writer numeric; share integer; begin
 perform 1 from public.profiles where id=u and status='active' for update;
 if not found then raise exception 'LOGIN_REQUIRED'; end if;
 select * into w from public.works where id=p_work for update;
 if not found or not public.work_visible(p_work) or not w.completed or w.price_full_work is null then raise exception 'WORK_UNAVAILABLE'; end if;
 select transaction_id into tx from public.work_purchases where user_id=u and work_id=p_work;
 if found then return jsonb_build_object('transaction_id',tx,'balance',public.wallet_balance(u),'replayed',true); end if;
 -- ไม่เก็บซ้ำถ้าเคยซื้อรายตอน: ให้ UI แสดงซื้อรายตอนต่อ; ไม่มี pro-rate ใน MVP
 if exists(select 1 from public.unlocks where user_id=u and work_id=p_work) then raise exception 'PARTIAL_OWNERSHIP'; end if;
 if not exists(select 1 from public.chapters where work_id=p_work and pricing='coin' and public.chapter_visible(id)) then raise exception 'NO_PAID_CHAPTERS'; end if;
 if exists(select 1 from public.chapters where work_id=p_work and not public.chapter_visible(id)) then raise exception 'WORK_NOT_FINAL'; end if;
 if p_expected_price is null or p_expected_price<>w.price_full_work then raise exception 'PRICE_CHANGED'; end if;
 if public.wallet_balance(u)<w.price_full_work then raise exception 'INSUFFICIENT_COINS'; end if;
 select writer_share_bps into strict share from public.platform_settings; writer:=round(w.price_full_work::numeric*share/10000,2);
 insert into public.ledger_transactions(kind,actor_id) values('work_unlock',u) returning id into tx;
 insert into public.coin_ledger(transaction_id,account,user_id,amount) values(tx,'wallet',u,-w.price_full_work);
 if writer>0 then insert into public.coin_ledger(transaction_id,account,author_id,amount) values(tx,'writer_payable',w.author_id,writer); end if;
 if writer<w.price_full_work then insert into public.coin_ledger(transaction_id,account,amount) values(tx,'platform_revenue',w.price_full_work-writer); end if;
 insert into public.work_purchases(user_id,work_id,transaction_id,coins) values(u,p_work,tx,w.price_full_work);
 insert into public.unlocks(user_id,chapter_id,work_id,transaction_id,source)
 select u,id,p_work,tx,'work' from public.chapters where work_id=p_work and pricing='coin';
 return jsonb_build_object('transaction_id',tx,'balance',public.wallet_balance(u),'replayed',false);
 end; $$;
-- แอดมินเท่านั้น; ไม่ใช่ refund / ห้ามยอดติดลบ / เหตุผลบังคับ / audit actor จาก JWT
create function public.admin_adjust_wallet(p_user uuid,p_delta integer,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
 declare tx uuid; begin
 if not public.is_admin('finance') then raise exception 'FORBIDDEN'; end if;
 if p_delta is null or p_delta=0 or p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'INVALID_ADJUSTMENT'; end if;
 perform 1 from public.profiles where id=p_user for update; if not found then raise exception 'ACCOUNT_UNAVAILABLE'; end if;
 if public.wallet_balance(p_user)+p_delta<0 then raise exception 'INSUFFICIENT_COINS'; end if;
 insert into public.ledger_transactions(kind,actor_id,reason) values('admin_adjustment',auth.uid(),p_reason) returning id into tx;
 insert into public.coin_ledger(transaction_id,account,user_id,amount) values(tx,'wallet',p_user,p_delta);
 insert into public.coin_ledger(transaction_id,account,amount) values(tx,'adjustment_clearing',-p_delta);
 insert into public.audit_log(actor_id,action,target_table,target_id,after_data) values(auth.uid(),'ADMIN_ADJUSTMENT','profiles',p_user::text,jsonb_build_object('transaction_id',tx,'delta',p_delta,'reason',p_reason));
 return tx; end; $$;

-- ยอดนักเขียน: เครดิตที่พ้น hold ลบ debit ทั้งหมด ลบ reservation pending/approved
create function public.writer_available(p_author uuid) returns numeric language sql stable security definer set search_path='' as $$
 select coalesce((select sum(case when amount<0 or created_at<=now()-make_interval(days=>s.hold_days) then amount else 0 end)
 from public.coin_ledger where account='writer_payable' and author_id=p_author),0)
 -coalesce((select sum(amount) from public.payout_requests where author_id=p_author and status in ('pending','approved')),0)
 from public.platform_settings s;
$$;
create function public.request_payout(p_amount numeric,p_bank_document uuid,p_request uuid) returns uuid language plpgsql security definer set search_path='' as $$
 declare a public.authors; existing public.payout_requests; result uuid; min_amount numeric; begin
 select * into a from public.authors where user_id=auth.uid() and status='approved' for update;
 if not found then raise exception 'AUTHOR_UNAVAILABLE'; end if;
 select * into existing from public.payout_requests where author_id=a.id and client_request_id=p_request;
 if found then
 if existing.amount<>p_amount or existing.bank_document_id<>p_bank_document then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
 return existing.id; end if;
 select minimum_payout into strict min_amount from public.platform_settings;
 if p_amount is null or p_amount<min_amount or p_amount<>round(p_amount,2) or p_amount>public.writer_available(a.id) then raise exception 'PAYOUT_UNAVAILABLE'; end if;
 if exists(select 1 from public.works where author_id=a.id and status in ('suspended','takedown')) then raise exception 'AUTHOR_FUNDS_HELD'; end if;
 if not exists(select 1 from public.author_documents where id=p_bank_document and author_id=a.id and kind='bank' and verified_at is not null) then raise exception 'BANK_NOT_VERIFIED'; end if;
 insert into public.payout_requests(author_id,amount,bank_document_id,client_request_id) values(a.id,p_amount,p_bank_document,p_request) returning id into result;
 return result; end; $$;
-- การจ่ายเงินจริงไม่มีใน MVP; เปลี่ยนสถานะจำลองพร้อม debit writer_payable ใน transaction เดียว
create function public.admin_mock_pay_payout(p_payout uuid,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
 declare r public.payout_requests; aid uuid; tx uuid; begin
 if not public.is_admin('finance') then raise exception 'FORBIDDEN'; end if;
 if p_note is null or length(trim(p_note))<10 then raise exception 'NOTE_REQUIRED'; end if;
 select author_id into aid from public.payout_requests where id=p_payout;
 perform 1 from public.authors where id=aid for update;
 select * into r from public.payout_requests where id=p_payout for update;
 if not found then raise exception 'PAYOUT_UNAVAILABLE'; end if;
 if r.status='paid' then return r.transaction_id; end if;
 if r.status<>'approved' or not exists(select 1 from public.authors where id=aid and status='approved')
 or exists(select 1 from public.works where author_id=aid and status in ('suspended','takedown'))
 or not exists(select 1 from public.platform_settings where mock_enabled) then raise exception 'PAYOUT_UNAVAILABLE'; end if;
 insert into public.ledger_transactions(kind,actor_id,reason) values('mock_payout',auth.uid(),p_note) returning id into tx;
 insert into public.coin_ledger(transaction_id,account,author_id,amount) values(tx,'writer_payable',aid,-r.amount);
 insert into public.coin_ledger(transaction_id,account,amount) values(tx,'payout_clearing',r.amount);
 update public.payout_requests set status='paid',transaction_id=tx,paid_at=now(),admin_notes=p_note where id=p_payout;
 return tx; end; $$;

-- serialize การแก้ตอนกับซื้อทั้งเล่ม และ freeze catalog หลังขายทั้งเล่ม
create function public.guard_chapter() returns trigger language plpgsql security definer set search_path='' as $$
 declare w public.works; begin
 select * into w from public.works where id=new.work_id for update;
 if new.content_type<>w.kind then raise exception 'CONTENT_TYPE_MISMATCH'; end if;
 if tg_op='UPDATE' and (new.id<>old.id or new.work_id<>old.work_id) then raise exception 'CHAPTER_IDENTITY_IMMUTABLE'; end if;
 if exists(select 1 from public.work_purchases where work_id=w.id) then
 if tg_op='INSERT' then raise exception 'WORK_CATALOG_FROZEN'; end if;
 if tg_op='UPDATE' and (new.pricing<>old.pricing or new.coin_price<>old.coin_price or new.number<>old.number) then raise exception 'WORK_CATALOG_FROZEN'; end if;
 end if;
 return new; end; $$;
create trigger chapter_guard before insert or update on public.chapters for each row execute function public.guard_chapter();
create function public.admin_review_payout(p_payout uuid,p_status text,p_note text) returns void language plpgsql security definer set search_path='' as $$
 declare aid uuid; begin
 if not public.is_admin('finance') then raise exception 'FORBIDDEN'; end if;
 if p_status not in ('approved','rejected') or p_note is null or length(trim(p_note))<10 then raise exception 'INVALID_REVIEW'; end if;
 select author_id into aid from public.payout_requests where id=p_payout;
 perform 1 from public.authors where id=aid for update;
 update public.payout_requests set status=p_status::public.payout_status,admin_notes=p_note where id=p_payout and status='pending';
 if not found then raise exception 'PAYOUT_UNAVAILABLE'; end if;
 end; $$;

-- RLS default-deny ทุกตารางใน public; ไม่ใช้ blanket GRANT ALL ให้ client
 do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',t.tablename);
 execute format('revoke all on public.%I from anon, authenticated, service_role',t.tablename);
 end loop; end $$;
grant usage on schema public to anon,authenticated,service_role;
grant select on public.works,public.chapters,public.chapter_contents,public.chapter_pages,public.coin_packs to anon,authenticated;
grant select on public.profiles,public.authors,public.author_documents,public.unlocks,public.work_purchases,public.coin_ledger,public.mock_payments,public.bookshelf,public.reading_progress,public.reports,public.takedown_requests,public.payout_requests,public.audit_log to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert(user_id,display_name,bio,contract_version) on public.authors to authenticated;
grant insert,update,delete on public.works,public.chapters,public.chapter_contents,public.chapter_pages,public.bookshelf,public.reading_progress to authenticated;
grant insert(reporter_id,work_id,chapter_id,target_user_id,reason) on public.reports to authenticated;
grant insert(requester_id,work_id,claim,evidence_path) on public.takedown_requests to authenticated;
grant select on all tables in schema public to service_role;
-- service content/admin เขียนได้เฉพาะ allowlist; การเงินเขียนผ่าน RPC เท่านั้น
grant insert,update,delete on public.authors,public.author_documents,public.works,public.chapters,public.chapter_contents,public.chapter_pages,public.reports,public.takedown_requests,public.profiles,public.platform_settings,public.coin_packs,public.app_admins to service_role;
create policy profiles_self on public.profiles for select to authenticated using(id=auth.uid());
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy authors_self on public.authors for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy authors_apply on public.authors for insert to authenticated with check(user_id=auth.uid() and status='pending' and exists(select 1 from public.profiles where id=auth.uid() and status='active'));
create policy documents_self on public.author_documents for select to authenticated using(public.is_admin('finance') or exists(select 1 from public.authors a where a.id=author_id and a.user_id=auth.uid()));
create policy works_read on public.works for select to anon,authenticated using(public.work_visible(id) or public.owns_work(id) or public.is_admin());
create policy works_author_insert on public.works for insert to authenticated with check(status='draft' and exists(select 1 from public.authors a where a.id=author_id and a.user_id=auth.uid() and a.status='approved'));
create policy works_author_update on public.works for update to authenticated using(public.owns_work(id) and status='draft') with check(status='draft' and exists(select 1 from public.authors a where a.id=author_id and a.user_id=auth.uid() and a.status='approved'));
create policy chapters_read on public.chapters for select to anon,authenticated using(public.chapter_visible(id) or public.owns_work(work_id) or public.is_admin());
create policy chapters_author on public.chapters for all to authenticated using(public.owns_work(work_id) and status='draft') with check(public.owns_work(work_id) and status='draft');
create policy contents_read on public.chapter_contents for select to anon,authenticated using(public.can_read_chapter(chapter_id) or exists(select 1 from public.chapters c where c.id=chapter_id and public.owns_work(c.work_id)) or public.is_admin());
create policy contents_author on public.chapter_contents for all to authenticated using(exists(select 1 from public.chapters c where c.id=chapter_id and c.status='draft' and public.owns_work(c.work_id))) with check(exists(select 1 from public.chapters c where c.id=chapter_id and c.status='draft' and c.content_type='novel' and public.owns_work(c.work_id)));
create policy pages_read on public.chapter_pages for select to anon,authenticated using(public.can_read_chapter(chapter_id) or exists(select 1 from public.chapters c where c.id=chapter_id and public.owns_work(c.work_id)) or public.is_admin());
create policy pages_author on public.chapter_pages for all to authenticated using(exists(select 1 from public.chapters c where c.id=chapter_id and c.status='draft' and public.owns_work(c.work_id))) with check(exists(select 1 from public.chapters c where c.id=chapter_id and c.status='draft' and c.content_type='manga' and public.owns_work(c.work_id)) and storage_path like auth.uid()::text||'/'||chapter_id::text||'/%' and storage_path !~ '\.\.');
create policy packs_read on public.coin_packs for select to anon,authenticated using(active);
create policy unlocks_self on public.unlocks for select to authenticated using(user_id=auth.uid());
create policy purchases_self on public.work_purchases for select to authenticated using(user_id=auth.uid());
create policy ledger_self on public.coin_ledger for select to authenticated using((account='wallet' and user_id=auth.uid()) or (account='writer_payable' and exists(select 1 from public.authors a where a.id=author_id and a.user_id=auth.uid())) or public.is_admin('finance'));
create policy payments_self on public.mock_payments for select to authenticated using(user_id=auth.uid() or public.is_admin('finance'));
create policy shelf_self on public.bookshelf for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.work_visible(work_id));
create policy progress_self on public.reading_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.can_read_chapter(chapter_id));
create policy reports_self on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin());
create policy reports_add on public.reports for insert to authenticated with check(reporter_id=auth.uid() and status='open');
create policy takedown_self on public.takedown_requests for select to authenticated using(requester_id=auth.uid() or public.is_admin());
create policy takedown_add on public.takedown_requests for insert to authenticated with check(requester_id=auth.uid() and status='open' and evidence_path like auth.uid()::text||'/%' and evidence_path !~ '\.\.');
create policy payouts_self on public.payout_requests for select to authenticated using(public.is_admin('finance') or exists(select 1 from public.authors a where a.id=author_id and a.user_id=auth.uid()));
create policy audit_admin on public.audit_log for select to authenticated using(public.is_admin());
-- app_admins/platform_settings/ledger_transactions ไม่มี client policy

-- view นี้ตั้งใจใช้สิทธิ์ owner เพื่อ expose เฉพาะข้อมูลสาธารณะที่เลือก (ไม่มี contract/KYC)
create view public.author_public with (security_barrier=true) as
 select a.id,a.display_name,a.bio from public.authors a join public.profiles p on p.id=a.user_id where a.status='approved' and p.status='active';
grant select on public.author_public to anon,authenticated,service_role;

-- ปิด EXECUTE default ของทุกฟังก์ชันใหม่ (รวม trigger helpers และยอดของคนอื่น)
revoke execute on all functions in schema public from public,anon,authenticated,service_role;
grant execute on function public.is_admin(text),public.owns_work(uuid),public.work_visible(uuid),public.chapter_visible(uuid),public.can_read_chapter(uuid) to anon,authenticated,service_role;
grant execute on function public.my_wallet(),public.unlock_chapter(uuid,integer),public.unlock_work(uuid,integer),public.request_payout(numeric,uuid,uuid),public.admin_adjust_wallet(uuid,integer,text),public.admin_mock_pay_payout(uuid,text) to authenticated;
grant execute on function public.mock_topup(uuid,uuid,uuid) to service_role;
grant execute on function public.admin_review_payout(uuid,text,text) to authenticated;

-- Storage: ทั้งหมด private; covers เปิดอ่านผ่าน signed URL server; KYC admin-only
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('covers','covers',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('manga-pages','manga-pages',false,15728640,array['image/jpeg','image/png','image/webp']),
 ('author-kyc','author-kyc',false,10485760,array['image/jpeg','image/png','application/pdf']),
 ('takedown-evidence','takedown-evidence',false,10485760,array['image/jpeg','image/png','application/pdf'])
 on conflict(id) do nothing;
-- client ไม่ SELECT storage.objects → ไม่เซ็น URL ต้นฉบับ paid image เอง
-- upload author ใช้ path auth.uid()/chapter_id/random.ext; INSERT เท่านั้น ไม่มี overwrite
create policy reader_upload_evidence on storage.objects for insert to authenticated with check(bucket_id='takedown-evidence' and (storage.foldername(name))[1]=auth.uid()::text and name !~ '\.\.');
create policy author_upload_cover on storage.objects for insert to authenticated with check(bucket_id='covers' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.authors where user_id=auth.uid() and status='approved') and name !~ '\.\.');
create policy author_upload_page on storage.objects for insert to authenticated with check(bucket_id='manga-pages' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.chapters c where c.id::text=(storage.foldername(name))[2] and c.status='draft' and c.content_type='manga' and public.owns_work(c.work_id)) and name !~ '\.\.');
-- KYC upload: finance server ออก signed upload หลัง consent, ตรวจ mime/size/scanner, ไม่เปิด client policy
commit;

-- 6 พ.ย. 2569 เวลาไทย: RPC สำหรับ pitch mock เท่านั้น ไม่ยืนยัน KYC จริง
begin;
create function public.demo_admin_review_author(p_author uuid,p_decision text,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.authors; begin
 if not public.is_admin('moderator') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.platform_settings where mock_enabled) then raise exception 'MOCK_DISABLED'; end if;
 if p_decision is null or p_decision not in ('approved','rejected') or p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'INVALID_REVIEW'; end if;
 select * into a from public.authors where id=p_author for update;
 if not found then raise exception 'AUTHOR_NOT_FOUND'; end if;
 if a.status::text=p_decision then return jsonb_build_object('author_id',a.id,'status',a.status,'approved_at',a.approved_at,'replayed',true); end if;
 if a.status<>'pending' then raise exception 'AUTHOR_REVIEW_CONFLICT'; end if;
 update public.authors set status=p_decision::public.author_status,approved_at=case when p_decision='approved' then now() else null end where id=p_author returning * into a;
 insert into public.audit_log(actor_id,action,target_table,target_id,after_data)
 values(auth.uid(),'DEMO_AUTHOR_REVIEW','authors',a.id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason),'mock',true));
 return jsonb_build_object('author_id',a.id,'status',a.status,'approved_at',a.approved_at,'replayed',false);
end; $$;
revoke all on function public.demo_admin_review_author(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.demo_admin_review_author(uuid,text,text) to authenticated;
commit;

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
