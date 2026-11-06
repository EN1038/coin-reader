# API / ตาราง / การบัญชี
6 พ.ย. 2569 / 2026-11-06 · เวลาไทย · mock-only

## Contract และ auth
ฐาน API Supabase: `/rest/v1/*` (PostgREST), `/auth/v1/*` (managed Auth), `/functions/v1/*` (Deno)
- อ่าน catalog/ตอนฟรีใช้ anon key (ไม่ต้อง login); ตอนติดเหรียญใช้ JWT ที่ verify กับ Auth server
- ไม่ decode JWT แล้วเชื่อเอง; roles มาจาก `app_admins` ไม่ใช่ user_metadata
- ทุกตาราง public เปิด RLS; `author_public` เป็น allowlisted view ที่ตั้งใจเผยแพร่เฉพาะ id/display_name/bio ของนักเขียน approved/active
- API errors `{error: CODE}`; Edge map 400 validation, 401 login, 403 permissions/mock gate, 404 unavailable, 409 price/balance/idempotency, 500 unknown DB, 501 watermark TODO
- PostgREST errors ใช้รูปแบบ native `{code,message,details,hint}` ต่างจาก Edge; อย่า parse SQL details เพื่อแสดงต่อผู้ใช้
- RPC helper ที่รับ user_id เช่น wallet_balance **ไม่ grant ให้ client**; `my_wallet()` คืนยอดของผู้เรียกเท่านั้น
- ตอน/API ราคาคิดจาก DB; client ส่ง `expected_price` เพื่อป้องกันเปลี่ยนราคาหลังผู้ใช้ยืนยัน

## ตาราง
| ตาราง | keys/ข้อมูล | สิทธิ์ client |
|---|---|---|
| auth.users / profiles | auth uuid, display_name, status, random watermark_id | self read; update display_name เท่านั้น |
| app_admins | user_id + moderator/finance/superadmin | ไม่มี direct read/write; trusted SQL provision |
| platform_settings | singleton, writer_share_bps, hold_days, minimum_payout, mock_enabled | ไม่มี direct access; service config พร้อม audit |
| authors | user_id UNIQUE, display_name, contract_version/accepted_at, status, approved_at | self apply (server time), self read; public ผ่าน view |
| author_documents | author_id, kind, storage_path, verified_at, retention_until | self/finance metadata read; server upload/verify |
| works | author_id, kind novel/manga, title/slug/synopsis/cover/category/tags/rating/status, price_full_work/completed/published_at | published general read; approved owner draft write |
| chapters | work_id, number UNIQUE ต่อเรื่อง, pricing free/coin, coin_price, publish_at, content_type/status | published metadata read; owner draft write |
| chapter_contents | chapter_id, body | free/entitled read; owner draft write |
| chapter_pages | chapter_id, page_number, storage_path | free/entitled read; owner draft write ตาม path ของตน |
| coin_packs | coins, amount_thb, active, is_example_data | active read |
| ledger_transactions | kind, actor_id, reason, creation_xid | ไม่มี client access; append-only |
| coin_ledger | transaction_id, account, user_id/author_id, signed amount | self wallet/own writer entries; finance read; **ไม่มี write** |
| mock_payments | user_id, client_request_id, provider/event/ref UNIQUE, pack+amount snapshot, tx | self/finance read; service RPC write |
| work_purchases / unlocks | user+work UNIQUE / user+chapter UNIQUE; tx | self read; DB RPC write |
| bookshelf | user+work primary key | self CRUD เฉพาะงาน visible เมื่อเพิ่ม |
| reading_progress | user+work primary key, chapter_id+work FK, position 0..1 | self CRUD เฉพาะตอนอ่านได้ |
| reports | reporter, target อย่างเดียว work/chapter/user, reason, status | self insert/read, admin read; server review |
| takedown_requests | requester, work, claim, evidence_path, status, admin_notes | login submit/read self; server review |
| payout_requests | author, bank document ref, amount, request id, status, ledger tx | self read; request/review/paid ผ่าน RPC |
| audit_log | actor/action/target/before/after/time | admin read; trigger/RPC append เท่านั้น |

`SECURITY DEFINER` ทุกฟังก์ชันกำหนด search_path ว่างและ qualify objects; revoke default EXECUTE และ grant เฉพาะ allowlist ทุกฟังก์ชัน trigger/internal ถูกปิดจาก API

## Ledger double-entry
หน่วยเดียวคือ mock coin; เงินบาทแสดงราคาแพ็กเท่านั้น ไม่ใช้ floating point
- เติม 100: clearing −100; wallet +100
- ซื้อ 10 (70/30): wallet −10; writer_payable +7.00; platform_revenue +3.00
- จ่ายนักเขียนจำลอง 100: writer_payable −100; payout_clearing +100 (ไม่ถอนเหรียญผู้อ่าน/ไม่โอนเงินจริง)
- admin adjustment +5: wallet +5; adjustment_clearing −5 พร้อมเหตุผลและ actor
- ทุก txn sum=0, >=2 lines, validate deferred เมื่อ commit; ห้ามเติม line เข้า txn ที่ commit แล้ว
- บัญชี clearing ติดลบได้ตามความหมาย; **wallet ไม่ติดลบ** ตรวจ trigger + row lock; ไม่มี balance column ให้ client แก้
- เปลี่ยน config ส่วนแบ่งมีผลเฉพาะ txn ใหม่ ยอดเดิมไม่คำนวณย้อนหลัง; statement ประวัติใช้ ledger ที่บันทึกจริง
- ห้าม UPDATE/DELETE/TRUNCATE ledger/transaction/payment/unlock/purchase/audit; financial FK ไม่ cascade

## เติมจำลอง
`POST /functions/v1/mock-topup` `{pack_id}` + UUID `Idempotency-Key`
1. Edge ตรวจ local gate, Auth user ไม่ anonymous, body, CORS
2. service RPC `mock_topup(p_user,p_pack,p_request)` ล็อก profile แล้วเช็คซ้ำ
3. key เดิม pack เดิมคืน transaction เดิม + **ยอดปัจจุบัน** และ replayed=true แม้ pack ปิดแล้ว; key เดิมต่าง pack → IDEMPOTENCY_CONFLICT
4. pack ใหม่อ่าน server-side FOR SHARE, insert txn+ledger+payment ใน transaction เดียว; failure rollback ทั้งหมด
5. unique `(user_id,client_request_id)` และ `provider_event_id`, `provider_ref` เป็น defense-in-depth
6. `provider='mock'` CHECK บังคับ ยังไม่ยอมรับ provider จริง; ต่อจริงต้อง migration + payment_events แยก มี signature verification/event lifecycle/chargeback policy ก่อนใช้

## ปลดล็อก
`POST /functions/v1/unlock-chapter` เลือก chapter_id หรือ work_id อย่างเดียว + expected_price
- RPC ใช้ auth.uid(), profile FOR UPDATE; การเติม/ซื้อ/ปรับยอด serialize ต่อ wallet เดียว
- ตรวจ active, author approved/active, parent published/general, chapter published และ publish_at<=server now()
- lock chapter/parent ป้องกันราคาเปลี่ยนระหว่าง transaction; paid body แยกตาราง
- ถ้า unlock มีแล้วคืน txn เดิม ไม่หักซ้ำ; ถ้าฟรีคืน free=true ไม่สร้าง transaction
- ถ้า expected price ไม่ตรง → PRICE_CHANGED; ยอดไม่พอ → INSUFFICIENT_COINS (ไม่มี unlock/ledger ตกค้าง)
- ซื้อทั้งเรื่องเฉพาะ completed, ทุกตอนเผยแพร่แล้ว, มี paid chapter; หากเคยซื้อรายตอน **ปฏิเสธ PARTIAL_OWNERSHIP** ไม่มีส่วนลดชดเชยใน MVP
- ซื้อทั้งเรื่องสร้าง work_purchase และ unlock ทุก paid chapter ใน transaction เดียว; หลังขายทั้งเรื่องห้ามเพิ่มตอนใหม่ (WORK_CATALOG_FROZEN)
- chapter FK+UNIQUE ป้องกันตอนคนละเรื่อง/ซื้อซ้ำ; DB deadlock/serialization abort ให้ retry ทั้ง request (key เดิมสำหรับ topup)
- ระงับ/takedown ปิดการอ่านแม้ซื้อแล้ว ไม่มี automatic refund; policy ต้องแสดงก่อนขายจริง

## Writer / payout
- `request_payout(p_amount,p_bank_document,p_request)` lock author กันขอถอนซ้ำพร้อมกัน; key เดิมต่าง payload conflict
- available = เครดิต writer_payable ที่พ้น hold − debit ทั้งหมด − คำขอ pending/approved (reservation)
- pending = เครดิตที่ยังไม่พ้น hold; reservation ไม่ใช่ ledger movement; จ่ายแล้วเท่านั้น debit writer_payable
- config ตัวอย่าง hold 14 วัน, ขั้นต่ำ 100, ส่วนแบ่ง 7000 basis points; ไม่รวม gateway fees/tax ต้องตกลงก่อนเงินจริง
- bank_document ต้องเป็นของ author เดียวกัน kind=bank และ verified; ไม่มีเลขบัญชี plaintext ใน ledger
- author suspended/rejected ขอไม่ได้; เรื่องถูก suspended/takedown กัน request และ settlement ทั้งรายได้ของ author (conservative hold)
- finance ใช้ `admin_review_payout` pending→approved/rejected; `admin_mock_pay_payout` approved→paid พร้อม balanced debit; paid ซ้ำคืน tx เดิม
- payout status อื่นสงวนใน enum แต่ยังไม่มี client cancel route; service ไม่มี direct UPDATE payout grant ป้องกันเปลี่ยนสถานะข้ามบัญชี

## Admin/publishing stubs
HTTP admin routes ยังไม่มี implementation: ต้องตรวจ JWT role server-side แล้วจึงใช้ service CRUD (service key bypass RLS อย่าส่งต่อ client)
- approve/reject author → update authors.status + approved_at พร้อมตรวจสัญญา/KYC
- publish work/chapter → ตรวจ body/pages ครบ, content_type, prices, schedule, cover path, moderation; owner เขียนได้เฉพาะ draft
- takedown → update request + work.status='takedown' ใน transaction เดียว; HTTP stub ยังไม่ทำ ห้ามอ้างว่ารับเรื่องแล้วระงับอัตโนมัติ
- suspend user → profiles.status และ authors.status ถ้าเป็น writer; audit ทุก write ผ่าน trigger
- finance adjustments/review/settle ใช้ caller JWT RPC ไม่ใช้ service เพื่อรักษา actor_id
- service admin HTTP ต้อง forward verified JWT subject เป็น transaction context หรือใช้ dedicated authenticated admin RPC; direct service calls ที่ไม่มี JWT subject audit.actor_id=NULL ไม่ถือว่า audit admin ครบ ห้ามใช้ production จนแก้
- บันทึก audit แบบเลือก status/amount แทนการคัดลอก body/KYC/ข้อร้องเรียนที่มี PII; config/app_admins เก็บก่อน/หลังเต็ม

## Test vectors
| เคส | ก่อน / request | คาดหวัง |
|---|---|---|
| A | wallet=0, pack=100, key K | wallet=100, payment=1, entries=2, sum=0 |
| B | เรียก A ซ้ำด้วย K | wallet=100, tx เดิม, replayed=true |
| C | wallet=100, paid chapter=10 | wallet=90, unlock=1, writer=7/platform=3 |
| D | เรียก C ซ้ำ | wallet=90, tx เดิม, ไม่เพิ่ม ledger |
| E | wallet=0, paid chapter=10 | 409, ไม่มี unlock/entries |
| F | key K แต่ pack อื่น | 409 IDEMPOTENCY_CONFLICT |
| G | expected_price=99 แต่จริง=10 | 409 PRICE_CHANGED |
| H | user B อ่าน ledger/body ของ A | ledger ว่าง / body paid ไม่ปรากฏ |
| I | client INSERT ledger หรือ UPDATE profile.status | permission denied |
| J | admin adjustment ไม่มีเหตุผล / non-admin | ปฏิเสธ; มีเหตุผล finance → ledger+audit |
| K | ซื้อเต็ม 15 จากยอด100, ยังไม่เคยซื้อรายตอน | balance85, ทุก paid chapter unlock, replay ไม่เสียซ้ำ |
| L | transaction ไม่มี entry / sum ไม่ศูนย์ | COMMIT ล้มเหลว |

## การทดสอบก่อนเปิดจริง (ยังไม่ได้ทำ)
หลาย session: topup key ซ้ำพร้อมกัน 20 ครั้ง, 2 unlock เมื่อยอดพอแค่หนึ่ง, chapter/full-work พร้อมกัน, payout request/settlement พร้อมกัน; JWT หมดอายุ/ปลอม; signed URL expiry; storage path สลับผู้ใช้; Deno integration; native Supabase RLS/role/default grants; audit attribution บน admin HTTP
