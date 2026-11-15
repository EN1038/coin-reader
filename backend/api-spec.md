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

## สัญญา mock สำหรับพรีเซนต์ (อัปเดต 6 พ.ย. 2569 เวลาไทย)
**ส้มใช้ client mock store เป็นเส้นทางหลักของ demo ภายนอก** ไม่ต้องมี Supabase, ไม่เรียก gateway และไม่ใช้ KYC/คำร้อง/ยอดเงินจริง สัญญาต่อไปนี้เป็น interface ให้ mock adapter ใช้ ไม่ใช่คำกล่าวว่า HTTP ทุกเส้นทาง deploy แล้ว

ทางเลือก local มี Edge stub 4 ตัว (ยังไม่ deploy): `admin-reports-list`, `create-takedown`, `request-payout`, `admin-author-review` ต้อง `APP_ENV=local` + `DEMO_BACKEND_ENABLED=true`; JWT ตรวจ `/auth/v1/user`, admin ตรวจ RPC `is_admin('moderator')`; ไม่เชื่อ role/user_id ใน body
ทุก success ของสัญญาใหม่นี้ใช้ `{mock:true,source:"client-mock"|"edge-stub",data:...}`; source ต้องตรง runtime ที่ตอบจริง Client adapter ห้ามบอก source=edge-stub ถ้าไม่ได้เรียก backend
ทุก operation ด้านล่างเป็น POST `/functions/v1/<ชื่อ>` ทาง HTTP เมื่อมี Edge หรือเป็นชื่อ operation ใน client mock เมื่อไม่มี wrapper; request/response JSON Schema และ examples อยู่ใน `openapi.yaml` (`x-runtime`, `x-allowed-roles`, `x-mock-contract`)

| operation | ใครเรียกได้ | request | data ใน success | runtime ในชุดนี้ |
|---|---|---|---|---|
| writer-apply | logged-in applicant | display_name, contract_version, bio? | author_id, status=pending, contract_accepted_at | client mock; native POST /rest/v1/authors มีเดิมแต่ยังไม่มี Edge adapter |
| writer-dashboard | เจ้าของใบสมัคร pending/approved | {} | author_id, author_status, metrics_origin=mock-fixture, works_count, unlock_count, earnings{pending,available,reserved,paid}, policy{writer_share_bps:7000,hold_days:14,minimum_payout:100,placeholder:true} | client mock เท่านั้น; ไม่มี aggregation RPC/dashboard tracking จริง |
| admin-author-review | moderator / superadmin | author_id, decision=approved/rejected, reason 10–1000 chars | author_id, status, approved_at/null, replayed | Edge stub + demo_admin_review_author RPC ใน migration 0003; client mock ใช้ shape เดียวกัน |
| admin-reports-list | moderator / superadmin | status?, limit?=20 (1–100), offset?=0 (0–10000) | items[], limit, offset; sort created_at DESC,id DESC; ไม่มี total สมมติ | Edge stub อ่าน reports ผ่าน caller JWT/RLS; client mock ทางเลือก |
| admin-reports-review | moderator / superadmin | report_id, status=reviewing/resolved/rejected, reason | report_id, status | client mock เท่านั้น; ไม่ระงับเรื่องอัตโนมัติ |
| create-takedown | logged-in claimant | work_id, claim 20–3000 chars, evidence_path ≤240 chars | id, work_id, status=open, created_at | Edge stub insert ด้วย caller JWT/RLS; client mock ใช้ fixture path |
| admin-takedown-review | moderator / superadmin | request_id, decision=reviewing/takedown/rejected, reason | request_id, status, work_id, work_status | client mock เท่านั้น; การระงับฝั่ง backend ยังไม่ implement |
| request-payout | approved author เจ้าของรายได้ | amount>0 ทศนิยม≤2หลัก, bank_document_id, request_id UUID | payout_id, amount, status, request_id | Edge stub เรียก request_payout RPC เดิม; ไม่โอนเงิน |
| admin-payout-review | finance / superadmin | payout_id, decision=approved/rejected, reason | payout_id, status | client mock; underlying admin_review_payout RPC มีแล้ว แต่ไม่มี HTTP Edge wrapper ใหม่นี้ |
| admin-payout-pay | finance / superadmin | payout_id, note, mode=mock | payout_id, status=paid, transaction_id | client mock; underlying admin_mock_pay_payout RPC มีแล้ว แต่ไม่มี HTTP Edge wrapper ใหม่นี้ |
| admin-content-review | moderator / superadmin | target_kind=work/chapter, target_id, decision=published/suspended, reason | target_id, status | client mock เท่านั้น; ไม่ใช่ production moderation/publishing validation |

### เงื่อนไข transition / replay ที่ adapter ต้องทำตาม
- Author: pending→approved/rejected; approved_at ใช้เวลาจาก server/mock clock; ส่ง final decision เดิมคืน replayed=true ไม่เพิ่ม audit ซ้ำ; final decision ตรงข้าม = 409 AUTHOR_REVIEW_CONFLICT; การอนุมัติ demo **ไม่ยืนยันเอกสาร KYC จริง**
- Reports: open→reviewing→resolved/rejected; same status replay ไม่เพิ่ม audit ซ้ำ; ไม่เกี่ยวกับ ledger/refund
- Takedown: สร้างเป็น open ยังไม่ระงับ; open→reviewing แล้ว reviewing→takedown/rejected; decision=takedown ต้องแก้ request.status=resolved และ work.status=takedown แบบ atomic ใน client mock; ไม่มี Edge review ที่อ้างว่าระงับจริงแล้ว
- Payout request: ใช้ request_id เดิมเมื่อ retry; payload เดิมคืนรายการเดิมพร้อมสถานะปัจจุบัน; เปลี่ยน amount/bank_document_id → 409 IDEMPOTENCY_CONFLICT
- Payout review: pending→approved/rejected เท่านั้น; RPC เดิมไม่รับประกัน replay ของ review ให้ reload สถานะเมื่อ network uncertain; pay approved→paid มี ledger debit ใน transaction เดียว paid ซ้ำคืน tx เดิม ไม่โอนเงินจริง
- Writer dashboard pending แสดงสถานะใบสมัคร/metrics=0; approved ใช้ fixtures ติดป้าย `mock-fixture`; ไม่มีข้อมูล view/read tracking จริงใน backend
- Client role switcher เป็นเครื่องมือแสดง UI เท่านั้น **ไม่ใช่ authorization จริง**; persistence/reset ของ client store ให้ส้มเลือกและประกาศ ไม่เขียนว่าบันทึกใน Supabase ถ้าไม่ได้เชื่อมต่อ

### Error contract สำหรับ demo
ทุก failure `{error:"CODE"}` (ไม่มี mock success envelope):
- 400: INVALID_UUID, UNKNOWN_FIELD, INVALID_FIELD, INVALID_REVIEW, INVALID_STATUS, INVALID_PAGINATION, INVALID_AMOUNT, INVALID_EVIDENCE_PATH, INVALID_REFERENCE, CONSTRAINT_VIOLATION
- 401: LOGIN_REQUIRED / INVALID_TOKEN; 403: FORBIDDEN / DEMO_DISABLED / MOCK_DISABLED / AUTHOR_UNAVAILABLE
- 404: NOT_FOUND (client mock) / AUTHOR_NOT_FOUND (author RPC)
- 409: ALREADY_EXISTS (สมัครซ้ำ), AUTHOR_REVIEW_CONFLICT, INVALID_TRANSITION (client review), PAYOUT_UNAVAILABLE, AUTHOR_FUNDS_HELD, BANK_NOT_VERIFIED, IDEMPOTENCY_CONFLICT, CONTENT_NOT_READY
- 413 BODY_TOO_LARGE (body รวม >4096 bytes; claim ภาษาไทยอาจชน byte limit ก่อนจำนวนอักษร), 415 JSON_REQUIRED, 500 DATABASE_ERROR/INTERNAL_ERROR, 503 SERVER_NOT_CONFIGURED
- 501 ยังใช้เฉพาะ watermark ที่ยังไม่ทำ **ไม่ใช้เป็นสัญญา success ของ admin/writer pitch**; HTTP เส้นทางที่มีแต่ client mock ยังไม่มี server listener ไม่ใช่การรับประกันว่าจะตอบ HTTP 200 จริง

### การลอง Edge ทางเลือก (local เท่านั้น)
1. ใช้ฐาน Supabase local แยกสำหรับ demo; migration 0001→0002→0003 ตามลำดับ; หรือ schema.sql + seed0002 (อย่ารัน 0001/0003 ซ้ำอีก)
2. `.env.example` มี DEMO_BACKEND_ENABLED=false; เปิดเฉพาะ local ทดสอบ ไม่เปิด production; provision moderator/finance ผ่าน trusted SQL เท่านั้น
3. Stub ทั้ง 4 รับ user จาก verified JWT; ไม่ใช้ service key ใน wrapper ใหม่นี้; author RPC รักษา auth.uid() เป็น audit.actor_id และเขียนเหตุผลใน DEMO_AUTHOR_REVIEW
4. create-takedown ตรวจ path prefix user_id; ยังไม่มีตรวจ object existence/AV/หลักฐานจริง ใช้ fixture เท่านั้น; non-idempotent create อาจได้คำร้องซ้ำเมื่อ retry (reload ก่อนส่งใหม่)
5. Writer apply/dashboard, report review, takedown review, content review และ admin payout HTTP facade ยังเป็นสัญญาสำหรับ client mock; ไม่เพิ่ม server permissions เพื่อเลียนแบบว่าทำแล้ว
6. Config **70/30, hold14วัน, min100 เป็น placeholder สำหรับ demo/pitch** ไม่ใช่ข้อเสนอธุรกิจ/อัตราที่อนุมัติแล้ว; bank_document สำหรับ payout local ต้อง fixture verified ของ author เดียวกัน ห้าม bypass ownership

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

## เศรษฐกิจผู้อ่าน (8 พ.ย. 2569) — check-in, ตั๋ว, referral, ทิป, คอมเมนต์, ราคาต่อตอน

migration `0004_reader_economy.sql` เพิ่มคอลัมน์และตาราง เปิด RLS และล็อกแถวการเงินให้ append-only
ยังไม่มี SQL RPC ที่ลงรายการเหล่านี้ เส้นทางที่เดินได้ในเดโมคือ client mock (`web/src/lib/mock`) ซึ่งห้ามให้ UI เขียน `coin_ledger` ตรง ๆ เช่นกัน
`can_read_chapter` เดิมยังดู `pricing` กับ `unlocks` เท่านั้น ยังไม่รู้จัก `free_episode_count` / `follow_to_read` / ตั๋ว — ตอนจะเผยแพร่จริง ฟังก์ชัน publish ต้องตั้ง `pricing='free'` ให้ช่วงตอนฟรี และ RPC อ่านต้องตามกฎด้านล่าง

### เอนทิตี
| ตาราง / คอลัมน์ | ความหมาย | client |
|---|---|---|
| works.free_episode_count | ตอนที่ 1..N อ่านฟรี แม้แถวตอนจะยังเก็บราคา | owner ตั้งผ่านงานเขียน; ผู้อ่านอ่านได้อย่างเดียว |
| chapters.follow_to_read | ถ้าติดตามเรื่องอยู่ อ่านตอนนี้ได้โดยไม่เสียเหรียญ มิฉะนั้นจ่าย `coin_price` | เหมือนกัน |
| chapters.coin_price | ราคาต่อตอนที่นักเขียนตั้ง ไม่จำเป็นต้องเท่ากันทุกตอน | metadata อ่านได้เมื่อตอนเผยแพร่ |
| coin_packs.bonus_coins | เหรียญแถม ไม่ใช่ฐานของ referral | อ่านแพ็กที่ active |
| platform_settings.referral_bps | ส่วนแบ่งผู้แนะนำ เป็น basis points ค่าเริ่ม 700 = 7% placeholder | ไม่มี direct access |
| check_ins | หนึ่งแถวต่อผู้ใช้ต่อวัน `unique(user_id, claim_date)` | SELECT ของตัวเอง ไม่มี INSERT |
| ticket_ledger | ตั๋วอ่านฟรี append-only ยอด = SUM(amount) ห้ามติดลบ | SELECT ของตัวเอง ไม่มี INSERT |
| referral_codes | รหัสของผู้ใช้ และ `referred_by` ห้ามชี้ตัวเอง | SELECT ของตัวเอง |
| referral_rewards | หนึ่งรางวัลต่อ `source_transaction_id` | SELECT ถ้าเป็นผู้แนะนำหรือผู้ถูกแนะนำ |
| comments / comment_likes | ความเห็นและไลก์รายตอน ผู้เขียนคอมเมนต์ต้องอ่านตอนนั้นได้ | INSERT ความเห็นของตัวเอง, ไลก์ของตัวเอง |
| work_ratings | ดาว 1–5 ต่อผู้ใช้ต่อเรื่อง แก้ดาวได้ ไม่ใช่บัญชีเงิน | INSERT/UPDATE ของตัวเอง |

### กฎ ledger (append-only, ทุก txn sum = 0, client ไม่เขียน)
หน่วยยังเป็นเหรียญจำนวนเต็มฝั่ง wallet นักเขียนยังเป็นทศนิยม 2 ตำแหน่งตามบัญชีเดิม
- เติมที่มียอดจ่าย `paid` และโบนัส `bonus`: `clearing -paid`, `promo_clearing -bonus` (ข้ามได้ถ้า bonus=0), `wallet +(paid+bonus)` ให้ผู้เติม kind `mock_topup` โบนัสไม่นับเป็นยอดจ่าย
- ปลดล็อกด้วยเหรียญ: เหมือนเดิม wallet −ราคา, writer_payable ส่วนแบ่ง, platform_revenue ที่เหลือ kind `chapter_unlock` ราคาต้องตรง `coin_price` หลังหักช่วงตอนฟรี
- เช็คอิน: `promo_clearing -coins`, `wallet +coins` kind `check_in` พร้อมแถว `check_ins` และถ้าได้ตั๋วให้แถว `ticket_ledger` amount เป็นบวก ใน transaction เดียว วันที่ซ้ำไม่ลงรายการซ้ำ
- แนะนำเพื่อน: `reward = floor(paid_coins * referral_bps / 10000)` จากยอดจ่ายของผู้ถูกแนะนำ **ไม่รวม bonus** แล้ว `promo_clearing -reward`, `wallet +reward` ของผู้แนะนำ kind `referral_reward` เหรียญนี้ใช้ในระบบได้ แต่ไม่ถอนเป็นเงิน
- ทิป: `wallet -T` ของผู้อ่าน, `writer_payable +share`, `platform_revenue +(T-share)` kind `tip` share ใช้ `writer_share_bps` เดียวกับยอดขาย และเป็น placeholder
- ใช้ตั๋ว: ไม่แตะ `coin_ledger` ใส่ `ticket_ledger` amount −1 reason `unlock` พร้อมแถว unlock ใน transaction เดียว ตั๋วไม่พอต้อง rollback ทั้งก้อน
- ปิดบัญชี: ไม่ลบ ledger เหรียญและตั๋วที่เหลือใช้ต่อไม่ได้และไม่คืน ตามนโยบายเหรียญ

ตัวกันที่มีแล้วใน 0001 ยังครอบ `coin_ledger`: UPDATE/DELETE/TRUNCATE ถูกปฏิเสธ, wallet ห้ามติดลบ, txn ที่ commit แล้วเติมแถวไม่ได้
0004 ใส่ตัวกันแบบเดียวกันให้ `check_ins`, `ticket_ledger`, `referral_rewards` และกันยอดตั๋วติดลบตอน INSERT

## การทดสอบก่อนเปิดจริง (ยังไม่ได้ทำ)
หลาย session: topup key ซ้ำพร้อมกัน 20 ครั้ง, 2 unlock เมื่อยอดพอแค่หนึ่ง, chapter/full-work พร้อมกัน, payout request/settlement พร้อมกัน; JWT หมดอายุ/ปลอม; signed URL expiry; storage path สลับผู้ใช้; Deno integration; native Supabase RLS/role/default grants; audit attribution บน admin HTTP
