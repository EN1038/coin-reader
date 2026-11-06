import { ApiError, body, rest, rpc, serve, session, uuid } from '../_shared/http.ts';
import { demo, demoGate, only } from '../_shared/demo.ts';
type Payout = { id: string; amount: number; status: string; is_example_data: boolean };
export async function handle(req: Request) {
  demoGate(); const s = await session(req); const input = await body(req);
  only(input, ['amount','bank_document_id','request_id']);
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1000000000 || Math.abs(input.amount * 100 - Math.round(input.amount * 100)) > 0.00001) throw new ApiError(400, 'INVALID_AMOUNT');
  const requestId = uuid(input.request_id);
  const id = uuid(await rpc('request_payout', { p_amount: input.amount, p_bank_document: uuid(input.bank_document_id), p_request: requestId }, s));
  const rows = await rest(`payout_requests?id=eq.${id}&select=id,amount,status,is_example_data`, s.token) as Payout[];
  if (!rows[0] || rows[0].is_example_data !== true) throw new ApiError(500, 'DATABASE_ERROR');
  return demo({ payout_id: id, amount: rows[0].amount, status: rows[0].status, request_id: requestId });
}
if (import.meta.main) serve(handle);
