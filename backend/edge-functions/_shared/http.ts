// Native fetch only: ไม่มี dependency SDK / ไม่มี key ใน response หรือ log
export class ApiError extends Error { constructor(public status: number, public code: string) { super(code); } }
const env = (key: string): string => { const value = Deno.env.get(key); if (!value) throw new ApiError(503, 'SERVER_NOT_CONFIGURED'); return value; };
export const uuid = (v: unknown): string => {
  if (typeof v !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)) throw new ApiError(400, 'INVALID_UUID'); return v;
};
export type Session = { token: string; userId: string | null };
export async function session(req: Request, required = true): Promise<Session> {
  const auth = req.headers.get('Authorization');
  if (!auth) { if (required) throw new ApiError(401, 'LOGIN_REQUIRED'); return { token: env('SUPABASE_ANON_KEY'), userId: null }; }
  if (!auth.startsWith('Bearer ')) throw new ApiError(401, 'INVALID_TOKEN');
  const token = auth.slice(7);
  if (!required && token === env('SUPABASE_ANON_KEY')) return { token, userId: null };
  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new ApiError(401, 'INVALID_TOKEN');
  const user = await response.json();
  // anonymous Supabase auth ไม่ใช่บัญชีซื้อเหรียญที่ยืนยันแล้ว
  if (!user.id || user.is_anonymous) throw new ApiError(401, 'LOGIN_REQUIRED');
  return { token, userId: uuid(user.id) };
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) throw new ApiError(415, 'JSON_REQUIRED');
  const text = await req.text(); if (new TextEncoder().encode(text).length > 4096) throw new ApiError(413, 'BODY_TOO_LARGE');
  try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0; return value; } catch { throw new ApiError(400, 'INVALID_JSON'); }
}
export async function rest(path: string, token: string, init: RequestInit = {}, privileged = false): Promise<unknown> {
  const key = env(privileged ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY');
  const result = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${privileged ? key : token}`, 'Content-Type': 'application/json', ...init.headers } });
  if (!result.ok) {
    const error = await result.json().catch(() => ({}));
    const code = String(error.message ?? 'UPSTREAM_ERROR');
    const known: Record<string, number> = { LOGIN_REQUIRED: 401, FORBIDDEN: 403, ACCOUNT_UNAVAILABLE: 403, INSUFFICIENT_COINS: 409, PRICE_CHANGED: 409, IDEMPOTENCY_CONFLICT: 409, PARTIAL_OWNERSHIP: 409, MOCK_DISABLED: 403, PACK_NOT_FOUND: 404, CHAPTER_UNAVAILABLE: 404, WORK_UNAVAILABLE: 404, WORK_NOT_FINAL: 409, NO_PAID_CHAPTERS: 409 };
    throw new ApiError(known[code] ?? 500, known[code] ? code : 'DATABASE_ERROR');
  }
  return result.status === 204 ? null : result.json();
}
export const rpc = (name: string, args: object, s: Session, privileged = false) => rest(`rpc/${name}`, s.token, { method: 'POST', body: JSON.stringify(args) }, privileged);
export async function signedPage(path: string): Promise<string> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const result = await fetch(`${env('SUPABASE_URL')}/storage/v1/object/sign/manga-pages/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 120 }),
  });
  if (!result.ok) throw new ApiError(503, 'SIGNING_FAILED');
  const value = await result.json();
  if (typeof value.signedURL !== 'string') throw new ApiError(503, 'SIGNING_FAILED');
  return `${env('SUPABASE_URL')}/storage/v1${value.signedURL}`;
}
export function serve(handler: (req: Request) => Promise<unknown>) {
  Deno.serve(async req => {
    const origin = req.headers.get('Origin');
    const allow = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(x => x.trim());
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (origin && !allow.includes(origin)) return new Response(JSON.stringify({ error: 'ORIGIN_FORBIDDEN' }), { status: 403, headers });
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, idempotency-key';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED');
      // TODO deployment gate: shared Redis/DB token-bucket per user/IP; gateway max body + timeout.
      const result = await handler(req); return new Response(JSON.stringify(result), { headers });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(500, 'INTERNAL_ERROR');
      return new Response(JSON.stringify({ error: err.code }), { status: err.status, headers });
    }
  });
}
