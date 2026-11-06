# คำถามที่ยังค้าง
6 พ.ย. 2569 / 2026-11-06 · เวลาไทย

## ตัดสินใจแล้ว ไม่เปิดกลับเอง
- Payment mock-only ไม่ต่อ gateway/webhook จริง; ไม่ใช้เงิน/ไม่ติดต่อคนนอก
- เหรียญคืนไม่ได้ ไม่มี refund ledger/endpoint; admin adjustment ต้องมีเหตุผลเท่านั้น
- VIP เฟส 2 ไม่มีตาราง VIP; frontend/หานักเขียนไม่อยู่ในงานนี้

## สำคัญก่อนเปลี่ยนจาก mock →เงินจริง
1. **ส่วนแบ่ง/ภาษี:** 70/30 gross, 1 coin≈1 THB เป็นสมมติฐาน; gateway fee ก่อน/หลังแบ่ง? rounding? ภาษีมูลค่าเพิ่ม/หัก ณ ที่จ่าย/50 ทวิ ใครรับผิดชอบ? การจ่ายเป็นเงินบาทและ rounding ทำอย่างไร?
2. **Hold/withdrawal:** hold 14 วัน, ขั้นต่ำ100 เป็น placeholder; freeze หลังร้องเรียนระดับเรื่องหรือทั้ง author, appeal/SLA, dual approval payout/adjustment และเครดิต mock จะถูก reset อย่างไร? ห้ามโอนจากยอดจำลอง
3. **Legal/e-money:** คุณกมลัตเลื่อนทนายเพราะ mock; ก่อนเงินจริงต้องยืนยันโครงสร้างผู้ขาย/รับชำระแทน/e-money, สัญญานักเขียน, takedown และนโยบายไม่คืนเหรียญเมื่อเนื้อหาหาย/chargeback ไม่ใช่ฟันธงว่าผ่านข้อยกเว้นแล้ว
4. **Gateway จริง:** เลือก provider หลังตรวจ onboarding; event schema/signature/idempotency lifecycle, reconciliation, chargeback, failed/pending, sandbox ก่อน production (ไม่ implement ใน MVP นี้)
5. **PDPA/KYC/18+:** ใครเป็น controller, finance reviewer, retention/DSAR, age/minor policy, cross-border/DPA? ตอนนี้ 18+ ปิดการอ่านไว้ ไม่ถือว่ามี age verification

## ต้องตกลง/พัฒนาต่อก่อน demo ที่ครบ flow
- Full-work: ปัจจุบันเฉพาะ completed, ทั้งหมดเผยแพร่, ไม่มี partial ownership; freeze เพิ่มตอนหลังขายทั้งเล่ม ยอมรับข้อจำกัดนี้หรือจะออกแบบ pro-rata ในเฟสถัดไป?
- Novel body ใช้ plain text/Markdown/HTML? storage/content sanitizer และ editor schema ต้องตกลงกับส้ม; ไม่ render HTML ดิบ
- Watermark renderer ยังไม่มี: paid image fail closed; เลือก Edge vs image-worker และ budget ก่อนเปิดใช้งานจริง
- Admin HTTP routes/publishing validation/KYC uploader ยังเป็น design-only; audit actor ห้าม NULL สำหรับ admin actions จริง; เพิ่ม read-audit KYC ด้วย
- ระบุ admin owner สำหรับ coin packs/settings, policy change effective date, การตรวจ audit และ retention job
- Proof ที่ยังขาด: Supabase integration/storage signing/Deno runtime และ concurrent SQL; PGlite ไม่แทนการทดสอบเหล่านี้
