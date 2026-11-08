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

## บัญชีเดโม / Demo accounts

ใช้ได้เมื่อ `VITE_USE_MOCK=true` (ค่าใน `.env.example`)  
Works while `VITE_USE_MOCK=true` (the value in `.env.example`).

| บทบาท / Role | อีเมล / Email | รหัส / Password |
|---|---|---|
| ผู้อ่าน / Reader | `demo@example.com` | `demo1234` |
| นักเขียน / Writer | `writer@example.com` | `demo1234` |
| เพื่อนที่ถูกชวน / Referred friend | `friend@example.com` | `demo1234` |
| แอดมิน / Admin | ล็อกอิน mock บัญชีใดก็ได้ / any mock login | `demo1234` |

แอดมินเป็นแดชบอร์ด mock: แบนเนอร์บอกว่าไม่ใช่ RBAC จริง บัญชีที่ล็อกอินแล้วเปิด `/admin` ได้  
Admin is a mock dashboard. The banner says this is not real RBAC; any signed-in mock account can open `/admin`.

นักเขียนและแอดมินคลิกได้ แต่ยังไม่ทำ responsive  
Writer and admin screens are clickable mocks and are not responsive.

## โครงรีโป / Layout

| Path | คืออะไร / What it is |
|---|---|
| `plan.md` | แผนผลิตภัณฑ์ / product plan |
| `pitch-gap.md` | ช่องว่างก่อนพรีเซนต์ / pitch gap notes |
| `design/` | โทเคน, ม็อกอัป, ไวร์เฟรม / tokens, mockups, wireframes |
| `backend/` | schema, OpenAPI, edge stubs (ยังไม่ deploy) / schema, OpenAPI, edge stubs (not deployed) |
| `web/` | แอป React + Vite + TypeScript (mock) / app |
