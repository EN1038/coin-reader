import { ApiError, body, rest, serve, session, uuid } from '../_shared/http.ts';
import { demo, demoGate, only, stringField } from '../_shared/demo.ts';
type Created = { id: string; work_id: string; status: string; created_at: string };
export async function handle(req: Request) {
  demoGate(); const s = await session(req); const input = await body(req);
  only(input, ['work_id','claim','evidence_path']);
  const evidence = stringField(input.evidence_path, 1, 240);
  if (!evidence.startsWith(`${s.userId}/`) || evidence.includes('..') || evidence.includes('\\') || !/^[a-zA-Z0-9/_\-.]+$/.test(evidence)) throw new ApiError(400, 'INVALID_EVIDENCE_PATH');
  const rows = await rest('takedown_requests?select=id,work_id,status,created_at', s.token, {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ requester_id: s.userId, work_id: uuid(input.work_id), claim: stringField(input.claim,20,3000), evidence_path: evidence }),
  }) as Created[];
  if (!rows[0]) throw new ApiError(500, 'DATABASE_ERROR');
  return demo(rows[0]); // mock receipt เท่านั้น ไม่ใช่ notice ทางกฎหมาย/ไม่ระงับงานอัตโนมัติ
}
if (import.meta.main) serve(handle);
