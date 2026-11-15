import { ApiError, body, rpc, serve, session, uuid } from '../_shared/http.ts';
serve(async req => {
  if (Deno.env.get('MOCK_PAYMENTS_ENABLED') !== 'true' || Deno.env.get('APP_ENV') !== 'local') throw new ApiError(403, 'MOCK_DISABLED');
  const s = await session(req); const data = await body(req);
  if (Object.keys(data).some(k => k !== 'pack_id')) throw new ApiError(400, 'UNKNOWN_FIELD');
  // ไม่มีรับราคา/จำนวนเหรียญ/user_id จาก client; RPC snapshot ราคาแพ็กจาก DB
  return rpc('mock_topup', { p_user: s.userId, p_pack: uuid(data.pack_id), p_request: uuid(req.headers.get('Idempotency-Key')) }, s, true);
  // TODO gateway จริง: endpoint แยก, signature + event dedupe + amount/currency/ref verification;
  // ห้ามใช้ redirect หรือ client บอก paid เป็นหลักฐาน และไม่ reuse mock route บน production
});
