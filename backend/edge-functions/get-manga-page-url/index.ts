import { ApiError, body, rest, rpc, serve, session, signedPage, uuid } from '../_shared/http.ts';
type Page = { chapter_id: string; storage_path: string };
serve(async req => {
  const s = await session(req, false); const data = await body(req);
  if (Object.keys(data).some(k => k !== 'page_id')) throw new ApiError(400, 'UNKNOWN_FIELD');
  const id = uuid(data.page_id);
  // caller JWT + RLS ก่อนใช้ service key; ไม่มีรับ storage path โดยตรงจากผู้ใช้
  const pages = await rest(`chapter_pages?id=eq.${id}&select=chapter_id,storage_path`, s.token) as Page[];
  if (!pages.length || !(await rpc('can_read_chapter', { p_chapter: pages[0].chapter_id }, s))) throw new ApiError(404, 'PAGE_UNAVAILABLE');
  const chapters = await rest(`chapters?id=eq.${pages[0].chapter_id}&select=pricing`, s.token) as { pricing: string }[];
  const paid = chapters[0]?.pricing === 'coin';
  // Stub เท่านั้น: ไม่มี image rasterizer ในชุดนี้; paid image fail closed โดย default
  if (paid && Deno.env.get('ALLOW_UNWATERMARKED_MOCK') !== 'true') throw new ApiError(501, 'WATERMARK_NOT_IMPLEMENTED');
  if (paid && Deno.env.get('APP_ENV') !== 'local') throw new ApiError(501, 'WATERMARK_NOT_IMPLEMENTED');
  // TODO rasterize HMAC(user watermark_id, rotation-key) บน server → private derivative → sign derivative เท่านั้น
  return { url: await signedPage(pages[0].storage_path), expires_in: 120, watermarked: false, mock: true };
});
