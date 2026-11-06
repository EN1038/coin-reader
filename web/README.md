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
- ยอดเริ่มต้น: 248 เหรียญ (ตัวอย่าง)
- แพ็ก: 50 / 100 / 300 เหรียญ = บาท ตาม seed `0002_seed_coin_packs.sql`

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
| `/legal/tos` `/legal/privacy` `/legal/coins` | ข้อกำหนด / ความเป็นส่วนตัว / นโยบายเหรียญ |

## โครงเท่านั้น (ไม่บล็อกส่งมอบ)

- `/writer` — โครงนักเขียน
- `/admin` — โครงแอดมิน

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
