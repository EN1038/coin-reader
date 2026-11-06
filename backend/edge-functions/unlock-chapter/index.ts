import { ApiError, body, rpc, serve, session, uuid } from '../_shared/http.ts';
serve(async req => {
  const s = await session(req); const data = await body(req);
  if (Object.keys(data).some(k => !['chapter_id','work_id','expected_price'].includes(k))) throw new ApiError(400, 'UNKNOWN_FIELD');
  if (Boolean(data.chapter_id) === Boolean(data.work_id)) throw new ApiError(400, 'ONE_TARGET_REQUIRED');
  if (!Number.isSafeInteger(data.expected_price) || Number(data.expected_price) < 0 || Number(data.expected_price) > 2147483647) throw new ApiError(400, 'INVALID_PRICE');
  const whole = Boolean(data.work_id);
  return rpc(whole ? 'unlock_work' : 'unlock_chapter', { [whole ? 'p_work' : 'p_chapter']: uuid(whole ? data.work_id : data.chapter_id), p_expected_price: data.expected_price }, s);
});
