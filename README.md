# Twilight Blue

เว็บอ่านนิยายและมังงะ ปลดล็อกตอนด้วยเหรียญ พร้อมธีมสว่าง/มืด  
A novel and manga reader: unlock chapters with coins, and switch between light and dark.

ชื่อผลิตภัณฑ์คือ **Twilight Blue** (โฟลเดอร์โปรเจกต์เคยชื่อ `coin-reader`)  
Product name: **Twilight Blue** (this folder was historically called `coin-reader`).

## สถานะ MVP / MVP status

- การชำระเงินเป็น **mock** เท่านั้น ยังไม่ต่อเกตเวย์จริง และไม่มีคีย์ชำระเงินในรีโป  
  Payment is **mock only**. There is no live gateway and no payment credentials in this repo.
- **ไม่มี VIP** ใน MVP (ไว้เฟสถัดไป)  
  **VIP is not in the MVP.**
- **เหรียญคืนไม่ได้**  
  **Coins are non-refundable.**
- `backend/` เป็น schema, migration, OpenAPI และเอกสารสำหรับ Supabase — **ยังไม่ได้ deploy**  
  `backend/` is the Supabase schema, migrations, OpenAPI, and docs — **not deployed yet**.  
  อย่า commit anon key, service role หรือรหัสผ่านจริง  
  Do not commit anon keys, service-role keys, or real passwords.

## รันเว็บ / Run the web app

```bash
cd web && npm install && npm run dev
```

ถ้ายังไม่มีไฟล์ env ให้คัดลอกเทมเพลต (โหมด mock ไม่ต้องใส่ Supabase key):  
If you do not have a local env file yet, copy the template (mock mode needs no Supabase key):

```bash
cp .env.example .env
```

รันคำสั่งนั้นจากในโฟลเดอร์ `web/` แล้วเปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`)  
Run that copy from inside `web/`, then open the URL Vite prints (usually `http://localhost:5173`).

## บัญชีเดโม / Demo login

ใช้ได้เมื่อ `VITE_USE_MOCK=true` (ค่าใน `.env.example`)  
Works while `VITE_USE_MOCK=true` (the value in `.env.example`).

- Email: `demo@example.com`
- Password: `demo1234`

## โครงรีโป / Layout

| Path | คืออะไร / What it is |
|---|---|
| `plan.md` | แผนผลิตภัณฑ์ / product plan |
| `design/` | โทเคน, ม็อกอัป, ไวร์เฟรม / tokens, mockups, wireframes |
| `backend/` | schema และเอกสาร Supabase (ยังไม่ deploy) / Supabase schema and docs (not deployed) |
| `web/` | แอปผู้อ่าน React + Vite + TypeScript / reader app |
