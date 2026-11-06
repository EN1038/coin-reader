-- ค่าสมมติเท่านั้น · 6 พ.ย. 2569 เวลาไทย · ห้ามใช้กับเงินจริง
begin;
insert into public.platform_settings(singleton,writer_share_bps,hold_days,minimum_payout,mock_enabled,is_example_data,note)
values(true,7000,14,100,true,true,'PLACEHOLDER: writer 70% / platform 30%, hold 14 วัน, ขั้นต่ำ 100; mock เท่านั้น รออนุมัติ')
on conflict(singleton) do nothing;
insert into public.coin_packs(id,name,coins,amount_thb,is_example_data) values
 ('10000000-0000-4000-8000-000000000050','ตัวอย่าง 50 เหรียญ (mock)',50,50,true),
 ('10000000-0000-4000-8000-000000000100','ตัวอย่าง 100 เหรียญ (mock)',100,100,true),
 ('10000000-0000-4000-8000-000000000300','ตัวอย่าง 300 เหรียญ (mock)',300,300,true)
on conflict(id) do nothing;
commit;
