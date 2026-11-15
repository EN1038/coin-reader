# Storage / signed URL / watermark
6 พ.ย. 2569 / 2026-11-06 · เวลาไทย

## Buckets
| bucket | access | path | limit |
|---|---|---|---|
| covers | private, server sign เฉพาะงาน visible | user_uuid/random_uuid.webp | 5 MiB; JPEG/PNG/WebP |
| manga-pages | private, server ตรวจ read entitlement ก่อน sign | user_uuid/chapter_uuid/random_uuid.webp | 15 MiB; JPEG/PNG/WebP |
| author-kyc | private, finance server เท่านั้น | author_uuid/random_uuid.pdf | 10 MiB; JPEG/PNG/PDF |
| takedown-evidence | private, owner upload/admin server read | user_uuid/random_uuid.pdf | 10 MiB; JPEG/PNG/PDF |

ทุก bucket public=false; manga/cover/evidence upload INSERT อย่างเดียวตาม folder+owner (มังงะต้อง approved owner ของ draft chapter), ไม่มี overwrite/delete/select client policy; KYC ไม่มี policy client เลย
server_role ของ Supabase bypass RLS; อย่าให้ browser ถือ key; `author_documents` มี metadata self read ได้แต่ไม่ให้ดาวน์โหลด KYC

`chapter_pages.storage_path` ต้อง prefix auth uid + chapter id เมื่อ owner เขียนผ่าน API; server provisioning ต้องใช้รูปแบบเดียวกันและตรวจ object ownership; ห้ามยอมรับ arbitrary path ให้ service sign
Storage database stubs ไม่ได้พิสูจน์ว่า Storage จริงบังคับ grants/owner field อย่างไร ต้อง integration test

## Signed page flow (stub ที่มี)
1. POST `/functions/v1/get-manga-page-url` `{page_id}`; free ไม่ต้อง login, paid ต้อง session
2. fetch chapter_pages ด้วย caller JWT/anon + RLS; RPC can_read_chapter ตรวจ published, server schedule, author active และ free/unlock
3. สร้าง signed URL อายุ **120 วินาที** ด้วย service key เฉพาะ path ที่ DB คืน; `Cache-Control:no-store`
4. paid manga ตอนนี้ตอบ **501 WATERMARK_NOT_IMPLEMENTED** โดย default; local demo เท่านั้นเปิด `APP_ENV=local` + `ALLOW_UNWATERMARKED_MOCK=true` เพื่อรับต้นฉบับพร้อม `watermarked:false`
5. ไม่รับ path จาก query/client; API key/JWT ผิด → reject; RLS ไม่พบ → 404 ปิดบัง existence

covers เป็น private แต่ยังไม่มี cover-signing endpoint: client ห้ามเรียก createSignedUrl เองโดยไม่ตรวจ catalog; งานถัดไปเพิ่ม server endpoint ที่เช็ค work_visible และคืน URL 120–300 วินาที
ไม่มี KYC signed URL endpoint ในชุดนี้; finance ต้องมี role check + audit การเปิดดู + no-store ก่อนพัฒนา

## Watermark ที่ยังต้อง implement
- ใช้ user watermark_id แบบ random ผ่าน HMAC(server secret, alias + rotation version); ติดรหัสสั้นในหลายจุดบนภาพ ไม่ฝัง email/national ID/auth UID ตรง
- โหลดต้นฉบับฝั่ง Edge/image-worker → rasterize watermark จริง → private derivative bucket/path → signed URL derivative เท่านั้น; **CSS overlay ฝั่ง client ไม่ใช่ watermark ป้องกันดาวน์โหลด**
- cache key: source hash/version + user pseudonym + watermark version; cache ข้ามผู้ใช้ไม่ได้
- สร้าง derivative แบบ atomic, TTL+delete lifecycle สั้น; log page id/user pseudonym/expiry ไม่ log signed URL
- งาน renderer, derivative bucket, worker sizing, HMAC rotation/mapping, purge และ rate limit ยังเป็น TODO ไม่มีการอ้างว่าตัวอย่างฝัง watermark แล้ว
- หากต้อง anonymous free watermark ให้ใช้ session alias หลังประกาศ privacy; ไม่ทำ device fingerprint แอบแฝง

## ข้อจำกัดจริง
ผู้ซื้อยังแคป/เซฟภาพได้; URL ที่รั่วใช้ได้ก่อนหมดอายุ; revoke สิทธิ์/takedown ไม่ยกเลิก URL ที่เซ็นไปทันที (สูงสุด TTL)
การป้องกันคือเพิ่มต้นทุนและตามแหล่งรั่ว ไม่ใช่รับประกันกันคัดลอก; ต้องมี privacy notice และช่องทาง appeal ก่อนใช้ watermark ลงโทษ
ก่อนเปิด: ทดสอบ expiry, forged page id, path คนอื่น, bucket list denial, unsigned originals denial, takedown/ban, dimension/decompression bomb และ storage egress budget
