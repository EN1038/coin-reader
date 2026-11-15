# Privacy / PDPA (draft)
6 พ.ย. 2569 / 2026-11-06 · เวลาไทย · ไม่ใช่คำปรึกษากฎหมาย

## เก็บเท่าที่จำเป็น
- Auth เก็บอีเมล/provider account ตาม Supabase; profiles เก็บ display name, สถานะ, random watermark alias ไม่คัดลอก email/เบอร์/วันเกิด
- ไม่ขอเลขบัตรประชาชนจากผู้อ่าน; ไม่เก็บ national ID, ชื่อจริง, email, เลขบัญชี หรือเนื้อหา KYC ลง ledger/audit/URL
- writer identity/bank docs อยู่ private `author-kyc`; ตารางเก็บ path ชนิดเอกสาร สถานะตรวจ และ retention date เท่านั้น
- สำเนาบัตรอาจมีข้อมูลอ่อนไหว (เช่นศาสนา) ต้องปิดทับ/ไม่เก็บส่วนเกิน; ไม่เหมารวมว่าข้อมูลการเงินทุกชนิดเป็นข้อมูลอ่อนไหวตาม ม.26
- contract_version + server acceptance timestamp สำหรับสัญญานักเขียน; ไม่ถือว่า acceptance นี้แทน consent ทุกวัตถุประสงค์
- watermark ใช้ pseudonymous HMAC ของ random alias ไม่ฝัง auth uid/email ตรงในภาพ; mapping เป็นข้อมูลส่วนบุคคล จำกัดการเข้าถึง

## สิทธิ์และฐานการประมวลผล (รอตรวจ)
- อ่าน/ซื้อ/ให้ค่าตอบแทน: ฐานสัญญาตามความจำเป็น; เอกสารภาษี/บัญชี: หน้าที่กฎหมายที่ทนาย/บัญชียืนยัน; abuse/security: ประเมิน legitimate interest
- ไม่มี advertising/analytics ที่ติดตามข้ามเว็บในชุดนี้; เพิ่มแล้วต้องทบทวน cookie consent/ROPA
- auth.users เป็น source of truth; ไม่เปิด users list; author_public เฉพาะนามปากกา/bio ที่ผู้เขียนตั้งใจเผยแพร่
- KYC document ไม่มี client read policy; finance backend ตรวจ app_admins แล้วออก signed URL อายุสั้น; admin moderator ไม่ได้สิทธิ์การเงิน
- ตัวอย่างนี้ยังไม่มี uploader/virus scanner, review UI, signed KYC endpoint หรือ DSAR endpoint ต้องทำก่อนรับ KYC จริง

## Retention: ข้อเสนอ ไม่ใช่ตัวเลขที่อนุมัติแล้ว
| ข้อมูล | ข้อเสนอ/สิ่งต้องยืนยัน |
|---|---|
| KYC rejected/abandoned | ลบหลังสิ้นกระบวนการ + 30 วัน (สมมติ ต้องตกลง appeal window) |
| KYC approved/bank docs | เก็บตลอดสัญญา + ระยะกฎหมาย/บัญชีที่ยังไม่กำหนด; retention_until ต้องตั้งก่อนรับจริง |
| ledger/payments/payout/audit | เก็บตามบัญชี/ภาษี/ข้อพิพาท รอเจ้าของข้อมูลและทนายระบุระยะ; ห้ามลบโดยทำลาย balanced ledger |
| reading_progress/bookshelf | ลบเมื่อผู้ใช้สั่งหรือปิดบัญชี; ข้อมูลไม่จำเป็นต้องคงเพื่อบัญชี |
| reports/evidence | เก็บตามอายุข้อร้องเรียน/appeal; legal hold ต้องระบุ owner/วันทบทวน |
| signed URL/access logs | ไม่ log token URL; เก็บ security metadata สั้นที่สุดที่จำเป็น (ต้องกำหนด) |

ยังไม่มี retention cron จริง ห้ามอ้างว่าลบอัตโนมัติ; object backup/lifecycle ต้องอยู่ในแผนลบด้วย

## การลบบัญชีและ immutable ledger
FK การเงินใช้ RESTRICT ไม่ cascade: hard delete auth.users อาจล้มเหลวโดยตั้งใจ ต้องมี trusted anonymization workflow แทน
- ปิด login/เปลี่ยน profiles.status='closed', ลบ display name/PII/reading history ตามสิทธิ์ที่กฎหมายอนุญาต
- คง pseudonymous financial reference เท่าที่จำเป็น; ตัด linkage เมื่อพ้นหน้าที่กฎหมายโดย migration/governance ที่ตรวจแล้ว
- อย่า disable immutable trigger เพื่อลบเอง; ยังไม่ implement DSAR/anonymization ห้ามรับคำขอลบแล้วบอกว่าเสร็จ

## Operation/security ก่อนรับจริง
- secret เฉพาะ server, rotate keys, least privilege, admin MFA, dual control สำหรับ adjustment/payout
- signed URL ไม่ใช่ DRM และผู้ได้ URL ใช้ต่อได้จนหมดอายุ; bearer token log ต้อง redact
- rate limits แบบ distributed: mock topup 5/min/user, unlock 30/min/user, page URL 120/min/user เป็นข้อเสนอ ไม่ใช่โค้ดที่ enforce แล้ว
- body size ตรวจทั้ง gateway และ function; limits ใน SQL ไม่แทน WAF; validate content HTML/sanitize ที่ render ป้องกัน XSS
- KYC upload allowlist MIME/size, magic-byte validation, AV scan, ไม่ใช้เลขบัตรเป็น filename; ห้ามส่งเอกสารจริงใน test fixture
- Singapore/ผู้ประมวลผลข้อมูล/สัญญา DPA และการส่งข้อมูลข้ามประเทศต้องยืนยันก่อนเปิด
- เจ้าของ data controller/ช่องทาง PDPA/incident owner/ระยะเวลาแจ้งเหตุที่ใช้จริงยังไม่กำหนด ต้องตรวจตัวบทและสถานการณ์ก่อนเขียน policy สาธารณะ
- 18+ fail closed ใน work_visible; ยืนยันอายุ/ผู้เยาว์/ความยินยอมผู้ปกครองเป็น blocker ก่อนเปิดฟีเจอร์ ไม่เก็บวันเกิดเพิ่มโดยไม่มีเหตุผล
