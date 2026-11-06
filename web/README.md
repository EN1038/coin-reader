# Twilight Blue — Frontend (MVP ผู้อ่าน)

เว็บอ่านนิยาย/มังงะ ปลดล็อกด้วยเหรียญ · React + Vite + TypeScript + Supabase client  
ชื่อผลิตภัณฑ์: Twilight Blue · ดีไซน์โดยเซน · API โดยสมาย · ฟรอนต์โดยส้ม
โฟลเดอร์โปรเจกต์ยังใช้ path `coin-reader` ตามเดิม

## รันโลคัล

```bash
cd /workspace/projects/coin-reader/web
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`)

```bash
npm run build    # ตรวจ TypeScript + production build
npm run preview  # ดูผล build
```

## ตัวแปรแวดล้อม

คัดลอกจาก `.env.example`:

| ตัวแปร | คำอธิบาย |
|---|---|
| `VITE_USE_MOCK` | `true` (ค่าเริ่ม) = ใช้ mock ในเครื่อง ไม่ต้องมี Supabase |
| `VITE_SUPABASE_URL` | URL โปรเจกต์ Supabase เมื่อต่อของจริง |
| `VITE_SUPABASE_ANON_KEY` | anon key เท่านั้น — **ห้ามใส่ service role** |

เมื่อ `VITE_USE_MOCK=false` และมี URL+anon ครบ ระบบจะเรียก REST/RPC + Edge (`mock-topup`, `unlock-chapter`, `get-manga-page-url`) ตาม api-spec

## บัญชี mock

- อีเมล: `demo@example.com`
- รหัส: `demo1234`
- ผู้อ่าน: `demo@example.com` / `demo1234` · ยอดเริ่ม 248 เหรียญ · ชั้นเริ่มต้นคาเฟ่ + เกาะไร้ชื่อ
- นักเขียน: `writer@example.com` / `demo1234` · ผูก author `a-001` (approved) · มีผลงาน seed ใน writer studio
- แอดมิน: ล็อกอินบัญชีใดก็เปิด `/admin` ได้ใน mock (แบนเนอร์บอกว่าไม่ใช่ RBAC จริง)
- LS key: `twilight-blue-mock-v2`
- แพ็ก: 50 / 100 / 300 เหรียญ = บาท ตาม seed `0002_seed_coin_packs.sql`

## Responsive (ผู้อ่าน)

Breakpoint ตาม tokens เซน: `sm 390` / `md 768` / `lg 861` / `xl 1280`  
ครอบคลุมหน้าผู้อ่านทั้งหมด — `/writer` และ `/admin` เป็น mock demo แบบเดสก์ท็อป ไม่ได้ทำ responsive

## ธีม

- โหมดสว่าง/มืด สลับได้ที่หน้า **บัญชีของฉัน** (`/me`)
- เก็บ preference ใน `localStorage` คีย์ `twilight-blue-theme`
- ใช้ `data-theme="light|dark"` + CSS variables ใน `src/styles/tokens.css`
- ใช้ tokens v2 จาก `design/tokens/tokens.css` (brand `#3D5A80`, light `#F3F6FA`, dark `#101827`, เหรียญ champagne `#DDC89D` / on-coin `#3F3523`)
- หน้าอ่านใช้ `.theme-reader-light` / `.theme-reader-dark` ตาม toggle (lh 1.85)

## กฎสำคัญ

- Client **ไม่เขียน** `coin_ledger` — เติมผ่าน `mock-topup` + `Idempotency-Key`, ปลดล็อกผ่าน `unlock-chapter`
- หน้ามังงะโหลดรูปผ่าน `get-manga-page-url` (mock คืน data-URL รูป SVG โครงสร้างเดียวกับ signed URL)
- ไม่มี VIP ใน MVP · เหรียญคืนไม่ได้ · payment เป็น mock เท่านั้น

## หน้าที่ทำแล้ว (ผู้อ่าน)

| เส้นทาง | หน้า |
|---|---|
| `/` | หน้าแรก |
| `/search` | ค้นหา/หมวด |
| `/works/:slug` | หน้าเรื่อง + สารบัญ + ปลดล็อก |
| `/read/novel/:workId/:chapterId` | อ่านนิยาย (dark, lh 1.85) |
| `/read/manga/:workId/:chapterId` | อ่านมังงะแนวตั้ง |
| `/auth/login` `/auth/signup` | เข้าสู่ระบบ / สมัคร (Google/LINE = stub) |
| `/wallet/topup` | เติมเหรียญ mock |
| `/wallet/pay/:status` | ผลชำระ pending/success/fail |
| `/wallet` | กระเป๋า + ประวัติ (อ่านอย่างเดียว) |
| `/library` | ชั้นหนังสือ |
| `/history` | ประวัติการอ่าน |
| `/me` | บัญชี |
| `/me/settings` | ตั้งค่าบัญชี (ธีม · กฎหมาย · PDPA · โซนลบ) |
| `/me/settings/delete` | ยืนยันลบบัญชี (พิมพ์ DELETE + รหัสผ่าน) |
| `/help` | ศูนย์ช่วยเหลือ + FAQ (เหรียญคืนไม่ได้) |
| `/help/report` | รายงานปัญหา (ไม่ใช่ฟอร์มคืนเหรียญ) |
| `/auth/forgot` | ลืมรหัสผ่าน (mock ส่งลิงก์) |
| `/legal/tos` `/legal/privacy` `/legal/coins` | ข้อกำหนด / ความเป็นส่วนตัว / นโยบายเหรียญ |
| `/legal/takedown` | แจ้งละเมิดลิขสิทธิ์ |
| `/authors/:authorId` | โปรไฟล์สาธารณะนักเขียน |

## นักเขียน / แอดมิน (mock demo · ไม่ทำ responsive)

แทนที่ StubPages แล้ว — ใช้ localStorage ไม่เรียก HTTP จริง · ส่วนแบ่ง 70/30 · hold 14 วัน · ขั้นต่ำถอน 100 = **placeholder ตัวอย่าง**

### Writer

| เส้นทาง | หน้า |
|---|---|
| `/writer` | แดชบอร์ดรายได้ mock + ทางลัด |
| `/writer/works` | รายการผลงาน |
| `/writer/works/new` · `/writer/works/:workId/edit` | สร้าง/แก้เรื่อง |
| `/writer/works/:workId/chapters/new` · `.../chapters/:chapterId/edit` | สร้าง/แก้ตอน |
| `/writer/payout` | ขอถอน + ประวัติ |
| `/writer/register` | สมัครนักเขียน / ดูสถานะ |

### Admin

| เส้นทาง | หน้า |
|---|---|
| `/admin` | สรุปคิว |
| `/admin/authors` | อนุมัติ/ปฏิเสธนักเขียน |
| `/admin/works` | รายการเรื่อง + ระงับ |
| `/admin/reports` | helpReports |
| `/admin/takedowns` | takedownRequests |
| `/admin/ledger` | อ่าน ledger mock |
| `/admin/payouts` | อนุมัติ/จ่ายถอน mock |
| `/admin/refunds` | stub — คืนเงินชำระผิดพลาดเท่านั้น ไม่คืนเหรียญ |

## โครงสร้างหลัก

```
src/
  lib/types.ts          ชนิดข้อมูล
  lib/supabase.ts       เลือก mock vs real
  lib/mock/*            seed + store (localStorage) + API
  lib/real/api.ts       เรียก Supabase จริงเมื่อปิด mock
  components/           Topbar, BottomNav, CoinPill, UnlockSheet, …
  pages/                หน้าทั้งหมด
  styles/tokens.css     จาก design/tokens
  styles/app.css        แพตเทิร์นจาก mockups/app.css
```
