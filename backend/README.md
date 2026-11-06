# Coin Reader — backend MVP (mock)
> 6 พ.ย. 2569 / 2026-11-06 · Asia/Bangkok (เวลาไทย) · SQL/RLS ทำงานใน smoke test; Edge เป็น stub ยังไม่ deploy

อ่าน `../plan.md` แล้ว: การตัดสินใจท้ายแผนสำคัญกว่าส่วนเก่า — **mock payment, เหรียญคืนไม่ได้, VIP เฟส 2** ไม่แก้แผนและไม่แตะหอแฟร์

## ขอบเขตและสถานะ
- Supabase Postgres/Auth/Storage/Edge Functions; frontend React+Vite+TS เป็นงานแยก ไม่มี frontend ในชุดนี้
- สมมติ **1 เหรียญ ≈ 1 บาท** เพื่อจำลอง ไม่ใช่สิทธิ์ถอนเหรียญเป็นเงินสด; เงินนักเขียนเป็นค่าตอบแทนแยกจาก wallet ผู้อ่าน
- ทุกธุรกรรมเป็นข้อมูลจำลอง **ห้ามโอนเงินจริง/นำยอด mock ไปจ่ายนักเขียน**; ไม่มีการเรียก gateway หรือ webhook จริง
- ไม่มี VIP, refund/reversal flow, wait-for-free, analytics หรือจัดหานักเขียน

## ไฟล์
| ไฟล์ | เนื้อหา |
|---|---|
| schema.sql | schema เต็ม เท่ากับ migration 0001 (ไม่รวม seed) |
| migrations/0001_init.sql | ตาราง, constraints, indexes, accounting RPC, RLS, private buckets |
| migrations/0002_seed_coin_packs.sql | แพ็ก 50/100/300, ส่วนแบ่ง 70/30, hold 14 วัน, ขั้นต่ำ 100 ทั้งหมดตัวอย่าง |
| openapi.yaml | OpenAPI 3.1: เส้นทางจริงของ Supabase/Edge + เส้นทาง admin ที่ยังเป็น design |
| api-spec.md | รายละเอียดตาราง/ledger/การซื้อ/test vectors/ขอบเขต stub |
| privacy.md | PDPA/KYC/minimization/retention ที่ยังต้องอนุมัติ |
| storage.md | folder ownership, signed URL 120 วินาที, watermark TODO และข้อจำกัด |
| open-questions.md | คำถามก่อนเปิดจริง/เฟสต่อไป |
| .env.example | ตัวแปร placeholder เท่านั้น |
| edge-functions/_shared/http.ts | verify JWT, REST/RPC wrapper, CORS และ error mapping |
| edge-functions/mock-topup/index.ts | เฉพาะ local + env gate, user จาก JWT, service RPC |
| edge-functions/unlock-chapter/index.ts | chapter หรือ work → caller-JWT RPC |
| edge-functions/get-manga-page-url/index.ts | ตรวจ entitlement แล้ว sign; paid watermark ยัง fail closed |
| tests/ | PGlite smoke + Supabase stubs + package lock + ผลรัน |

## กฎเหรียญที่บังคับใน DB
1. `coin_ledger` และ `ledger_transactions` append-only: UPDATE/DELETE/TRUNCATE ถูก trigger ปฏิเสธ รวม service role; client ไม่มี write grant/policy
2. ไม่มี balance ที่แก้ได้: `SUM(coin_ledger.amount)` ของ wallet เท่านั้น; wallet เป็นจำนวนเต็ม นักเขียนใช้ทศนิยม 2 ตำแหน่ง
3. ทุก transaction มีอย่างน้อย 2 แถว sum=0 ตรวจแบบ deferred ตอน COMMIT; transaction ที่ commit แล้วห้ามเพิ่มแถวด้วย `creation_xid`
4. `mock_topup` ล็อก profile → ตรวจ `(user_id,client_request_id)` UNIQUE → snapshot ราคา/เหรียญจาก pack → insert payment+ledger ครั้งเดียว; key เดิมต่าง pack = conflict
5. `unlock_chapter`/`unlock_work` SECURITY DEFINER ล็อก profile, ตรวจราคา/ยอด/เผยแพร่, debit+credit+entitlement ใน transaction เดียว; UNIQUE กันซื้อซ้ำ; ไม่รับ user_id จาก client
6. adjustment เฉพาะ finance/superadmin ผ่าน caller JWT พร้อมเหตุผล 10–1000 ตัวอักษรและ audit; ห้ามทำยอดติดลบ ไม่ใช่ช่องคืนเงิน
7. แบ่ง writer 70%/platform 30% เป็น **ค่าตัวอย่างรอตัดสินใจ** (basis points); ปัด writer 2 หลัก เศษให้ platform เพื่อ sum=0
8. DB owner ยัง disable trigger/เปลี่ยน schema ได้: จำกัดสิทธิ์ SQL/secret, แยก approval และตรวจ audit; ไม่อ้างว่ากัน DBA ได้

## วิธีรัน/ตรวจ
ชุดนี้เป็นไฟล์ออกแบบใหม่บน box ยังไม่มี repo/ไม่มี deployment; ไม่สร้าง repository หรือใช้บริการเสียเงิน

### ทดสอบ SQL แบบไม่ใช้ Docker
```sh
cd /workspace/projects/coin-reader/backend/tests
npm ci --ignore-scripts
npm test
```
PGlite จำลอง `auth`/`storage` ตาม `supabase_stub.sql`; ไม่ใช่ Supabase จริง และไม่ได้พิสูจน์ concurrent sessions

### Supabase local (ขั้นตอนสำหรับผู้รับงาน ยังไม่ได้รันในรอบนี้)
1. ใช้โปรเจกต์ Supabase local แยกใหม่เท่านั้น ไม่รันทับฐานที่มีตารางอื่นใน public
2. `supabase init` และ `supabase start` ใน sandbox ของทีม (ต้องมี Docker)
3. คัดลอก migration เป็น `supabase/migrations/20261106000100_init.sql` และ `20261106000200_seed.sql`; `supabase db reset`
4. คัดลอก `edge-functions/*` ไป `supabase/functions/`; ตั้ง local env จาก `.env.example` และ `supabase functions serve --env-file <local-env>`
5. anonymous free-page endpoint ต้อง gateway `verify_jwt=false`; function ตรวจ JWT เองเมื่อมี Authorization ส่วน endpoint อื่นใช้ JWT gateway + `/auth/v1/user`
6. สมัครบัญชี local ด้วย Supabase Auth; profile ถูกสร้างด้วย trigger (ผู้ใช้เดิมต้อง backfill ด้วย SQL ที่ตรวจแล้ว)
7. mock topup ต้อง `APP_ENV=local`, `MOCK_PAYMENTS_ENABLED=true` และ config DB `mock_enabled=true` พร้อมกัน; default env ปิด
8. provision app_admins ผ่าน trusted SQL เท่านั้น; user ห้าม self-assign role; ห้ามนำ service key ไปไว้ใน Vite

### ตรวจ contract/TypeScript
```sh
npx @redocly/cli lint openapi.yaml
# เมื่อมี Deno:
deno check edge-functions/*/index.ts
```
Endpoint ใต้ `/functions/v1/admin-*` เป็น design-only ตอบ 501 ตาม contract เมื่อพัฒนา router ต่อ; **ยังไม่มีไฟล์ implement** ส่วน RPC การเงินที่ระบุมีใน SQL แล้ว

## สิ่งที่ยังไม่พร้อม production
- ยังไม่ทดสอบ Supabase จริง: Auth hook, grants/default privileges, storage API signing, RLS/role mappings, HTTP integration
- ยังไม่ทดสอบหลาย connection พร้อมกัน/deadlock/retry; client ต้อง retry 40P01/40001 ด้วย key เดิม
- watermark ฝังในภาพยังไม่ implement; paid manga URL fail closed 501 เว้นแต่เปิด local-only bypass เพื่อ demo (response `watermarked:false`)
- distributed rate limit, image malware scan, moderation/publishing validation, KYC uploader, admin HTTP routes ยังเป็น TODO
- 18+ **ไม่เผยแพร่ให้ผู้อ่านทุกคนใน MVP** จนกว่าจะมีนโยบาย/การตรวจอายุจริง; ไม่ใช้ self-declared boolean หลอกว่าตรวจแล้ว
- บัญชี mock และเงินจริงต้องแยก environment/database ก่อนต่อ gateway จริง; ไม่ migrate เครดิตจำลองเป็นเงินจริง

## ผลตรวจรอบนี้
- PGlite 0.3.14: **46 checks ผ่าน** รวม RLS, A–E, replay/conflict, paid body, whole-work, append-only, nonzero commit, payout reservation/settlement, storage ownership และ takedown
- Deno 2.5.6: typecheck ทั้ง 3 Edge entrypoints ผ่าน; helper unit tests **7 ผ่าน** ด้วย mock fetch (ไม่มี Auth/Storage HTTP จริง)
- Redocly CLI 2.12.0: contract valid, **0 errors / 7 warnings**: 6 ข้อจาก 3 admin design-only routes ที่มีแต่ 501 และ 1 ข้อ metadata private license ไม่มี URL/identifier ไม่ใช่ schema errors
- `schema.sql` เท่ากับ `migrations/0001_init.sql` ตรวจใน smoke test; seed มี example flag ทุกแถว

หลักฐาน: `tests/test-results.txt`, `tests/edge-test-results.txt`, `tests/deno-check.txt`, `tests/openapi-lint.txt`
รัน helper: `npx deno@2.5.6 test --allow-env tests/edge_shared_test.ts`; generator contract: `python3 tests/build_contract.py` แล้ว lint ใหม่
PGlite และ helper mocks ผ่านไม่เท่ากับพร้อมเปิดบริการค่ะ
