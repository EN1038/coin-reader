import { ApiError, body, rpc, session, signedPage, uuid } from '../edge-functions/_shared/http.ts';
const assert = (v: unknown) => { if (!v) throw new Error('assertion failed'); };
const user = '20000000-0000-4000-8000-000000000001';
Deno.env.set('SUPABASE_URL','http://127.0.0.1:54321');
Deno.env.set('SUPABASE_ANON_KEY','fake-anon-key-test-only');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY','fake-service-key-test-only');
const originalFetch = globalThis.fetch;
async function rejects(fn: () => unknown | Promise<unknown>, code: string) {
  try { await fn(); } catch(e) { assert(e instanceof ApiError && e.code === code); return; } throw new Error('expected rejection');
}
Deno.test('UUID and malformed body rejected', async () => {
  assert(uuid(user) === user); await rejects(() => uuid('../evil'), 'INVALID_UUID');
  await rejects(() => body(new Request('http://local',{method:'POST',headers:{'Content-Type':'application/json'},body:'[]'})), 'INVALID_JSON');
});
Deno.test('body limit enforced', async () => {
  await rejects(() => body(new Request('http://local',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({x:'x'.repeat(4096)})})), 'BODY_TOO_LARGE');
});
Deno.test('anonymous free session, including SDK anon Authorization', async () => {
  assert((await session(new Request('http://local'),false)).userId === null);
  assert((await session(new Request('http://local',{headers:{Authorization:'Bearer fake-anon-key-test-only'}}),false)).userId === null);
  await rejects(() => session(new Request('http://local')), 'LOGIN_REQUIRED');
});
Deno.test('JWT is verified by Auth server rather than decoded', async () => {
  try {
    globalThis.fetch = ((_req: unknown, init?: RequestInit) => {
      assert(new Headers(init?.headers).get('Authorization')==='Bearer user-token');
      return Promise.resolve(Response.json({id:user,is_anonymous:false}));
    }) as typeof fetch;
    assert((await session(new Request('http://local',{headers:{Authorization:'Bearer user-token'}}))).userId === user);
    globalThis.fetch = (() => Promise.resolve(new Response(null,{status:401}))) as typeof fetch;
    await rejects(() => session(new Request('http://local',{headers:{Authorization:'Bearer forged'}})), 'INVALID_TOKEN');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('RPC caller context preserved; service only for privileged calls', async () => {
  try {
    const headers: Headers[]=[];
    globalThis.fetch = ((_req: unknown, init?: RequestInit) => { headers.push(new Headers(init?.headers)); return Promise.resolve(Response.json({ok:true})); }) as typeof fetch;
    await rpc('unlock_chapter',{p_chapter:user},{userId:user,token:'user-token'});
    await rpc('mock_topup',{p_user:user},{userId:user,token:'user-token'},true);
    assert(headers[0].get('Authorization')==='Bearer user-token');
    assert(headers[1].get('Authorization')==='Bearer fake-service-key-test-only');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('known DB errors mapped; unknown details hidden', async () => {
  try {
    globalThis.fetch = (() => Promise.resolve(Response.json({message:'INSUFFICIENT_COINS'},{status:400}))) as typeof fetch;
    await rejects(() => rpc('unlock_chapter',{}, {userId:user,token:'token'}),'INSUFFICIENT_COINS');
    globalThis.fetch = (() => Promise.resolve(Response.json({message:'private SQL detail'},{status:400}))) as typeof fetch;
    await rejects(() => rpc('unlock_chapter',{}, {userId:user,token:'token'}),'DATABASE_ERROR');
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test('storage signing uses 120s and service authentication', async () => {
  try {
    globalThis.fetch = ((_req: unknown, init?: RequestInit) => {
      assert(JSON.parse(String(init?.body)).expiresIn===120);
      assert(new Headers(init?.headers).get('Authorization')==='Bearer fake-service-key-test-only');
      return Promise.resolve(Response.json({signedURL:'/object/sign/manga-pages/test.webp?token=fake'}));
    }) as typeof fetch;
    assert((await signedPage(`${user}/test.webp`)).startsWith('http://127.0.0.1:54321/storage/v1/object/sign/'));
  } finally { globalThis.fetch=originalFetch; }
});
