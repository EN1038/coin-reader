# Twilight Blue — รายงานช่องว่างก่อนพรีเซนต์ทีม

ตรวจจากไฟล์จริงเมื่อ 6 พ.ย. 2569 (Asia/Bangkok)  
แหล่ง: `plan.md` · `design/README.md` · `backend/README.md` · `backend/open-questions.md` · `backend/api-spec.md` · `web/README.md` · `web/src/App.tsx` · `web/src/pages/*` · `web/src/lib/mock/seed.ts`

ขอบเขตการตรวจ: การเชื่อมต่อภายนอก (gateway จริง, OAuth จริง, Supabase deploy) **ตั้งใจเป็น mock — ไม่นับเป็นช่องว่าง**

---

## พร้อมโชว์ทีมได้แล้ว

ฝั่งผู้อ่านรัน mock ออฟไลน์ได้ (`VITE_USE_MOCK=true`) ตาม `web/README.md`

- **แบรนด์ + ธีม:** ชื่อ Twilight Blue · สลับสว่าง/มืดที่ `/me` · tokens จาก `design/tokens/tokens.css` คัดลอกไป `web/src/styles/tokens.css`
- **Responsive ฝั่งผู้อ่าน:** breakpoint ตามเซน (md 768 / lg 861 / xl 1280) — `/writer` `/admin` ไม่ทำตามที่ตกลง
- **หน้าผู้อ่านที่ใช้งานได้** (`web/src/App.tsx` + `web/README.md`):
  - `/` หน้าแรก · `/search` ค้นหา/หมวด · `/works/:slug` หน้าเรื่อง + สารบัญ + ปลดล็อก
  - `/read/novel/...` · `/read/manga/...`
  - `/auth/login` · `/auth/signup` (อีเมล mock)
  - `/wallet/topup` แพ็ก 50/100/300 · `/wallet/pay/:status` รอ/สำเร็จ/ล้มเหลว · `/wallet` กระเป๋า+ประวัติ
  - `/library` ชั้นหนังสือ (ปุ่มบันทึกที่หน้าเรื่อง) · `/history` ประวัติอ่าน
  - `/me` · `/legal/tos` · `/legal/privacy` · `/legal/coins` (ระบุเหรียญ**คืนไม่ได้**)
- **Flow เงินจำลอง:** ยืนยันปลดล็อกรายตอน/ทั้งเล่ม · เหรียญไม่พอ → ไปเติม · mock top-up มี Idempotency-Key · client ไม่เขียน ledger
- **บัญชี demo:** `demo@example.com` / `demo1234` · เริ่ม 248 เหรียญ (`web/src/lib/mock/store.ts`)
- **เนื้อหาตัวอย่าง:** นิยาย 4 + มังงะ 4 เรื่อง · ตอนฟรี+ติดเหรียญ (`web/src/lib/mock/seed.ts`)
- **ดีไซน์อ้างอิง:** hi-fi ผู้อ่านใน `design/mockups/` · wireframe นักเขียน 6 + แอดมิน 8 ใน `design/wireframes/` · ม็อก Twilight ใหม่: `home-mobile-{light,dark}.png` · `read-novel-mobile-{light,dark}.png`
- **Backend สำหรับคุยสถาปัตยกรรม:** schema + ledger append-only + mock RPC · PGlite 46/46 · อยู่ที่ `backend/` (ยังไม่ deploy Supabase จริง — ตามแผน mock)

---

## ยังขาดสำหรับ MVP (ควรมีก่อน pitch หรือบอกทีมว่ายังไม่มี)

เปรียบเทียบกับรายการหน้า/ฟีเจอร์ MVP ใน `plan.md` §2–3 และขอบเขตที่เซนตัดใน `design/README.md`

### ดีไซน์ (missing screens vs plan/design)

| รายการ | สถานะจากไฟล์ |
|---|---|
| ศูนย์ช่วยเหลือ + ขอคืนเงิน/รายงาน | แผนมีในรายการหน้าผู้อ่าน · เซนตัดออกชัดใน `design/README.md` §สิ่งที่ตัดออก · **ไม่มีม็อก / ไม่มี route เว็บ** |
| ฟอร์มแจ้งละเมิดลิขสิทธิ์ (takedown) | แผนมีในหน้ากฎหมาย · เซนตัด · backend มีตาราง `takedown_requests` แต่ **ไม่มีหน้าเว็บ** |
| ตั้งค่าบัญชี / ลบบัญชี / แบบฟอร์ม PDPA | แผนมี · เซนตัด · `/me` มีแค่โปรไฟล์สั้น + ลิงก์กฎหมาย + logout |
| ลืมรหัสผ่าน | แผนระบุ login/สมัคร/**ลืมรหัส** · **ไม่มีหน้า / ไม่มีม็อก** |
| Rebrand ม็อกอัปครบชุด | `design/README.md` ยอมรับว่า PNG ส่วนใหญ่ + overview ยังโทนม่วง/ชื่อชั่วคราว — re-render ครบเฉพาะหน้าแรก+อ่านนิยาย light/dark |
| โปรไฟล์สาธารณะนักเขียน | แผนมีในนักเขียน 7 หน้า · wireframe ชุด writer ไม่มีไฟล์โปรไฟล์สาธารณะแยก · เว็บไม่มี |

### ฟังก์ชันฝั่งผู้อ่าน

- **ชั้นหนังสือว่างตอนเปิดครั้งแรก:** มีปุ่มบันทึกที่หน้าเรื่องแล้ว แต่ seed ไม่ใส่ชั้นเริ่มต้น — โชว์ทีมต้องกดบันทึกก่อน (`LibraryPage.tsx` + `store.ts` bookshelf: [])
- **เนื้อหานิยายส่วนใหญ่เป็น filler:** มีเนื้อหาจริงพออ่านเฉพาะ `คาเฟ่ตอนตีสาม` ตอน 1 — ตอนอื่นเป็นข้อความตัวอย่าง (`seed.ts` `fillerBody`)
- **หน้ามังงะเป็น SVG จำลอง:** `mock/api.ts` คืน data-URL + `watermarked: false` ไม่ใช่ภาพการ์ตูนจริง
- **ปกเรื่องเป็นโทนสี:** ไม่มีไฟล์ปกจริง (Cover ใช้ `cover_tone`)
- **Google / LINE บน login:** เป็นปุ่ม stub (`alert` ยังไม่เชื่อม) — ถ้านับเป็น “หน้า auth ตามแผน” ยังไม่ครบ แต่ถ้ามองเป็น external OAuth ให้อยู่หมวดเลื่อนได้
- **ไม่มีหน้าช่วยเหลือ/รายงาน/ทakedown/ลืมรหัส/ลบบัญชี** ตามตารางดีไซน์ด้านบน
- **เส้นทาง Supabase จริงมีโครง** (`web/src/lib/real/api.ts`) แต่ยังไม่ทดสอบกับโปรเจกต์จริง — ไม่ใช่ช่องว่าง pitch ถ้าโชว์ mock

### ฟังก์ชันนักเขียน/แอดมิน (โครงอย่างเดียว vs ใช้งานได้)

แผน MVP ยังรวมนักเขียน CRUD + dashboard ถอน และแอดมินอนุมัติ/เนื้อหา/ธุรกรรม/audit (`plan.md` §2)

| ชั้น | สถานะจริง |
|---|---|
| ดีไซน์ | มี **wireframe lo-fi** ครบชุด writer 6 + admin 8 ที่ `design/wireframes/` — **ยังไม่ hi-fi** |
| Backend | มีตาราง/RPC ที่เกี่ยวกับ authors, payout, reports, takedown, audit ใน schema · **admin HTTP routes เป็น design-only ตอบ 501** (`backend/README.md`, `api-spec.md`) |
| Frontend | `/writer` และ `/admin` = **StubPages.tsx ข้อความอย่างเดียว** ไม่มีฟอร์ม/CRUD/dashboard |

**สรุปตรงๆ สำหรับ pitch:** ฝั่งนักเขียน/แอดมินยัง “โชว์ภาพ wireframe + อธิบาย schema” ได้ แต่ **กดใช้งานในเว็บไม่ได้**

### เนื้อหา/ข้อมูล demo สำหรับพรีเซนต์

- แพ็กเหรียญติดป้าย **ตัวอย่าง** · 1 เหรียญ ≈ 1 บาท เป็นสมมติฐาน
- ส่วนแบ่ง 70/30 · hold 14 วัน · ขั้นต่ำถอน 100 = **placeholder** (`migrations/0002_seed_coin_packs.sql`, `open-questions.md`) — อย่าพูดว่าเป็นนโยบายผลิตภัณฑ์ที่ล็อกแล้ว
- บัญชี demo + ยอด 248 พร้อมโชว์ flow เติม/ปลดล็อก
- ยังไม่มี URL Vercel สาธารณะในเอกสารนี้ — โค้ดอยู่ PR GitHub (`EN1038/coin-reader`) ตามสถานะงานก่อนหน้า; โชว์ทีมใช้ `npm run dev` หรือ deploy ทีหลัง

---

## ตั้งใจเลื่อน (ไม่ใช่ช่องว่าง)

ตามการตัดสินใจท้าย `plan.md` + ขอบเขตดีไซน์/แบ็กเอนด์

- **VIP** (เฟส 2) — ไม่มีหน้า/ตาราง/ปุ่ม
- **รอฟรี (wait-for-free)** — เฟส 2
- **Payment gateway จริง / PromptPay QR / webhook จริง** — mock only
- **ทนายตรวจ e-money** — เลื่อนจนกว่าพ้น mock
- **คืนเหรียญ** — นโยบายล็อกแล้วว่าคืนไม่ได้ (ไม่ใช่ฟีเจอร์ที่ขาด)
- **Supabase / Storage / Auth จริงบนคลาวด์** — ยังไม่ deploy; โชว์ mock
- **Google / LINE OAuth จริง**
- **Watermark ฝังภาพจริง** — backend paid manga fail closed 501 จนกว่ามี renderer (`backend/README.md`)
- **โบนัสเหรียญ / หลาย gateway / กระทบยอดอัตโนมัติ**
- **Flow สมัครนักเขียน KYC เต็ม + สัญญาเต็ม**
- **โอนเงินนักเขียนอัตโนมัติ / e-withholding**
- **Responsive หน้า writer/admin** — ผู้ใช้ระบุว่าไม่ต้อง
- **หานักเขียน/เนื้อหาจริง** — ทีมอื่น

---

## แนะนำก่อนพรีเซนต์ (เรียงความสำคัญ · ทำด้วย mock ได้)

1. **ซ้อมสคริปต์ demo 7 นาทีบน mock:** login demo → เปิด `คาเฟ่ตอนตีสาม` อ่านตอนฟรี → ปลดล็อกตอนติดเหรียญ → เติมแพ็ก mock → ดูกระเป๋า → เปิดมังงะ `เกาะไร้ชื่อ` → สลับธีมที่ `/me` · บอกทีมชัดทุกจุดว่าเป็นข้อมูลตัวอย่าง
2. **มีสไลด์/หน้า wireframe นักเขียน+แอดมินแยกจากเดโมคลิกได้** เพราะ `/writer` `/admin` ในเว็บยังเป็น stub — อย่าพาทีมไปกดแล้วเจอหน้าว่างโดยไม่เตือน
3. **พูดนโยบายที่ล็อกแล้วให้จบใน 30 วินาที:** เหรียญคืนไม่ได้ · VIP เฟส 2 · เงินเป็น mock · ส่วนแบ่ง/ขั้นต่ำถอนยังไม่ล็อก (70/30 เป็นตัวอย่างใน seed)
4. **เติมชั้นหนังสือหรือ seed 1–2 เรื่องใน bookshelf เริ่มต้น** จะได้ไม่เปิด `/library` แล้วว่างตอนโชว์สด (`store.ts` เริ่ม `bookshelf: []`)
5. **ถ้ามีเวลา 1–2 ชม.:** ใส่เนื้อหานิยายอ่านจริงเพิ่มอีก 1–2 ตอนของเรื่องเด่น + ปรับ SVG มังงะให้อ่านดูเป็นตอนมากขึ้น (ยังไม่ต้องมีลิขสิทธิ์ภาพจริง) — ช่วยภาพลักษณ์ตอนพรีเซนต์มากที่สุดโดยไม่แตะ gateway

---

## บันทึกสั้นสำหรับโมจิ (สถานะส่งมอบ)

| ชั้น | Path | พร้อม pitch? |
|---|---|---|
| แผน | `plan.md` | ใช่ (มีบล็อกตัดสินใจท้ายไฟล์) |
| ดีไซน์ผู้อ่าน | `design/mockups/` | ใช่สำหรับ flow · สีครบเฉพาะบางหน้า |
| ดีไซน์ writer/admin | `design/wireframes/` | โชว์ภาพได้ · ยังไม่คลิกในเว็บ |
| Backend | `backend/` | คุยสถาปัตย์ได้ · ยังไม่ขึ้น cloud |
| Frontend ผู้อ่าน | `web/` | โชว์ demo mock ได้ |
| Frontend writer/admin | `web/src/pages/StubPages.tsx` | โครงอย่างเดียว |

