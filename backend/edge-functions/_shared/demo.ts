// ชุดสัญญาพรีเซนต์: ยังไม่ deploy; ห้ามใช้กับเงินจริง/เอกสาร KYC จริง
import { ApiError, rpc, type Session } from './http.ts';
export function demoGate() {
  if (Deno.env.get('APP_ENV') !== 'local' || Deno.env.get('DEMO_BACKEND_ENABLED') !== 'true') throw new ApiError(403, 'DEMO_DISABLED');
}
export function only(data: Record<string, unknown>, fields: string[]) {
  if (Object.keys(data).some(k => !fields.includes(k))) throw new ApiError(400, 'UNKNOWN_FIELD');
}
export function stringField(value: unknown, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) throw new ApiError(400, 'INVALID_FIELD');
  return value.trim();
}
export async function moderator(s: Session) {
  if (await rpc('is_admin', { p_role: 'moderator' }, s) !== true) throw new ApiError(403, 'FORBIDDEN');
}
export const demo = (data: unknown) => ({ mock: true, source: 'edge-stub', data });
