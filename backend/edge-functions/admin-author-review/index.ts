import { ApiError, body, rpc, serve, session, uuid } from '../_shared/http.ts';
import { demo, demoGate, moderator, only, stringField } from '../_shared/demo.ts';
export async function handle(req: Request) {
  demoGate(); const s = await session(req); await moderator(s); const input = await body(req);
  only(input, ['author_id','decision','reason']);
  if (!['approved','rejected'].includes(String(input.decision))) throw new ApiError(400, 'INVALID_REVIEW');
  return demo(await rpc('demo_admin_review_author', {
    p_author: uuid(input.author_id), p_decision: input.decision, p_reason: stringField(input.reason,10,1000),
  }, s)); // caller JWT รักษา actor ใน audit; ไม่ใช้ service key เขียนแทน admin
}
if (import.meta.main) serve(handle);
