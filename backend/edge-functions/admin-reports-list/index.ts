import { ApiError, body, rest, serve, session } from '../_shared/http.ts';
import { demo, demoGate, moderator, only } from '../_shared/demo.ts';
export async function handle(req: Request) {
  demoGate(); const s = await session(req); await moderator(s); const input = await body(req);
  only(input, ['status', 'limit', 'offset']);
  if (input.status !== undefined && !['open','reviewing','resolved','rejected'].includes(String(input.status))) throw new ApiError(400, 'INVALID_STATUS');
  const limit = input.limit ?? 20, offset = input.offset ?? 0;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 100 || !Number.isInteger(offset) || Number(offset) < 0 || Number(offset) > 10000) throw new ApiError(400, 'INVALID_PAGINATION');
  const filter = input.status ? `&status=eq.${input.status}` : '';
  const items = await rest(`reports?select=id,reporter_id,work_id,chapter_id,target_user_id,reason,status,created_at&order=created_at.desc,id.desc&limit=${limit}&offset=${offset}${filter}`, s.token);
  return demo({ items, limit, offset }); // ไม่มี total ที่แต่งขึ้น; caller JWT + admin RLS
}
if (import.meta.main) serve(handle);
