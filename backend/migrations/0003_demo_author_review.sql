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
