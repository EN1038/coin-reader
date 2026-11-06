import { handle as reports } from '../edge-functions/admin-reports-list/index.ts';
import { handle as takedown } from '../edge-functions/create-takedown/index.ts';
import { handle as payout } from '../edge-functions/request-payout/index.ts';
import { handle as author } from '../edge-functions/admin-author-review/index.ts';
import { ApiError } from '../edge-functions/_shared/http.ts';
const user='20000000-0000-4000-8000-000000000001', target='30000000-0000-4000-8000-000000000001', requestId='60000000-0000-4000-8000-000000000001';
const assert=(v:unknown)=>{if(!v)throw new Error('assertion failed')};
const req=(value:object)=>new Request('http://local',{method:'POST',headers:{Authorization:'Bearer verified-test-session','Content-Type':'application/json'},body:JSON.stringify(value)});
async function rejects(fn:()=>Promise<unknown>,code:string){try{await fn()}catch(e){assert(e instanceof ApiError&&e.code===code);return}throw new Error('expected rejection')}
Deno.env.set('SUPABASE_URL','http://127.0.0.1:54321');Deno.env.set('SUPABASE_ANON_KEY','fake-anon-key-test-only');Deno.env.set('APP_ENV','local');Deno.env.set('DEMO_BACKEND_ENABLED','true');
const originalFetch=globalThis.fetch;
function mock(route:(url:string,init?:RequestInit)=>Response){globalThis.fetch=((url:unknown,init?:RequestInit)=>{
 const u=String(url); assert(new Headers(init?.headers).get('Authorization')==='Bearer verified-test-session');
 if(u.endsWith('/auth/v1/user'))return Promise.resolve(Response.json({id:user,is_anonymous:false}));
 return Promise.resolve(route(u,init));
}) as typeof fetch;}
Deno.test('demo wrappers fail closed outside local gate',async()=>{try{Deno.env.set('APP_ENV','production');await rejects(()=>reports(req({})),'DEMO_DISABLED')}finally{Deno.env.set('APP_ENV','local')}});
Deno.test('admin report list requires moderator and preserves JWT',async()=>{try{
 mock(url=>url.endsWith('/rpc/is_admin')?Response.json(true):Response.json([]));
 const r=await reports(req({status:'open',limit:10,offset:0}));assert(r.mock&&r.source==='edge-stub');assert((r.data as {limit:number}).limit===10);
 mock(()=>Response.json(false));await rejects(()=>reports(req({})),'FORBIDDEN');
}finally{globalThis.fetch=originalFetch}});
Deno.test('report list validates pagination/status',async()=>{try{mock(()=>Response.json(true));await rejects(()=>reports(req({limit:1000})),'INVALID_PAGINATION');await rejects(()=>reports(req({status:'paid'})),'INVALID_STATUS')}finally{globalThis.fetch=originalFetch}});
Deno.test('create takedown injects caller, no auto suspension',async()=>{try{
 mock((url,init)=>{assert(url.includes('/takedown_requests?'));const b=JSON.parse(String(init?.body));assert(b.requester_id===user&&!('status'in b));return Response.json([{id:target,work_id:target,status:'open',created_at:'2026-11-06T11:49:00+07:00'}])});
 const r=await takedown(req({work_id:target,claim:'mock copyright claim for presentation only',evidence_path:`${user}/fixture.pdf`}));assert((r.data as {status:string}).status==='open');
 await rejects(()=>takedown(req({work_id:target,claim:'mock copyright claim for presentation only',evidence_path:`${target}/foreign.pdf`})),'INVALID_EVIDENCE_PATH');
}finally{globalThis.fetch=originalFetch}});
Deno.test('payout wrapper uses transactional caller RPC and request key',async()=>{try{
 mock((url,init)=>{if(url.endsWith('/rpc/request_payout')){const b=JSON.parse(String(init?.body));assert(b.p_request===requestId&&!('p_user'in b));return Response.json(target)}return Response.json([{id:target,amount:100,status:'pending',is_example_data:true}])});
 const r=await payout(req({amount:100,bank_document_id:target,request_id:requestId}));assert((r.data as {payout_id:string}).payout_id===target);
 await rejects(()=>payout(req({amount:1.001,bank_document_id:target,request_id:requestId})),'INVALID_AMOUNT');
}finally{globalThis.fetch=originalFetch}});
Deno.test('payout business errors retain 409 code without SQL leak',async()=>{try{
 mock(()=>Response.json({message:'BANK_NOT_VERIFIED'},{status:400}));await rejects(()=>payout(req({amount:100,bank_document_id:target,request_id:requestId})),'BANK_NOT_VERIFIED');
}finally{globalThis.fetch=originalFetch}});
Deno.test('author review preserves caller audit context and reason',async()=>{try{
 mock((url,init)=>{if(url.endsWith('/rpc/is_admin'))return Response.json(true);assert(url.endsWith('/rpc/demo_admin_review_author'));const b=JSON.parse(String(init?.body));assert(b.p_author===target&&b.p_decision==='approved'&&b.p_reason.length>=10);return Response.json({author_id:target,status:'approved',approved_at:'2026-11-06T11:49:00+07:00',replayed:false})});
 const r=await author(req({author_id:target,decision:'approved',reason:'demo review with fake fixture only'}));assert((r.data as {status:string}).status==='approved');
 await rejects(()=>author(req({author_id:target,decision:'paid',reason:'demo review with fake fixture only'})),'INVALID_REVIEW');
}finally{globalThis.fetch=originalFetch}});
