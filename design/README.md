# Twilight Blue — Design system v2 (MVP)

**เซน · 6 พ.ย. 2569**  
**ชื่อผลิตภัณฑ์:** Twilight Blue · path เดิม `coin-reader` ไม่เปลี่ยน  
อ้างอิงแผน: `/workspace/projects/coin-reader/plan.md` · ช่องว่าง: `../pitch-gap.md`

## สไตล์โดยสรุป
- แอปอ่านมือถือเป็นหลัก · **ไม่ใช้ sticky scrollytelling**
- ธีมสนธยา: dusk blue `#3D5A80` + indigo `#2E4666` เป็นแบรนด์หลัก; lavender เป็นรอง เหรียญใช้ champagne `#DDC89D` + ink `#3F3523` ไม่ใช้ทองเป็นแบรนด์หลัก
- UI Light: พื้น cool paper `#F3F6FA`, ข้อความ `#1C2C40` · UI Dark: navy `#101827`, ข้อความ `#E7EDF5`, primary `#A6C5ED`
- Reader Light: paper ฟ้าเทา `#F0F3F4` / ink `#293644` · Reader Dark: night `#0F171E` / off-white `#DCE2E6` · Sarabun 18px, lh **1.85 ขึ้นไป**, บรรทัดไม่เกิน 65ch
- ฟอนต์: Prompt (หัวข้อ) · Sarabun (เนื้อหา) · มี Noto Sans Thai เป็น fallback
- Contrast: ตรวจ **76 คู่ semantic จริง** จาก sRGB ตาม WCAG 2.x; ค่าต่ำสุด 5.05:1 (AA normal text ≥4.5) — ดู `tokens/tokens.json` → `contrast_AA_checked`

## ข้อจำกัด MVP ที่ยึดในการออกแบบ
| หัวข้อ | การตัดสินใจ | สะท้อนในดีไซน์ |
|---|---|---|
| Payment | **mock** | แบนเนอร์เตือนทุกหน้าเติม/ผลชำระ · ไม่มี QR จริง |
| เหรียญ | **คืนไม่ได้** | นโยบายเหรียญ + topup / unlock / wallet / help / report / takedown / ลบบัญชี |
| VIP | เฟส 2 | **ไม่มี** หน้า/ปุ่ม/แบดจ์ VIP |
| รอฟรี | เฟส 2 | ไม่มีในสารบัญ |
| หานักเขียน | ทีมอื่น | writer = wireframe ย่อ + โปรไฟล์สาธารณะสั้น · ไม่ทำ flow สมัครละเอียด |

ข้อมูลปก/ชื่อเรื่อง/นักเขียน/ราคาเหรียญในม็อก = **ตัวอย่าง** ติดป้ายทุกจุด  
ส่วนแบ่งนักเขียนยังไม่ล็อกผลิตภัณฑ์ — ใน wireframe ระบุว่าตลาด 50–72% จากแผน (ข้อมูลคู่แข่ง)

---

## โครงสร้างไฟล์

```
design/
  README.md                 ← ไฟล์นี้
  overview.png              ← ภาพรวมม็อกอัปผู้อ่านหลัก (โทนม่วงรอบก่อน — อ้างอิง flow)
  theme-preview.png         ← เทียบ home+reader light/dark
  tokens/
    tokens.json             ← แหล่งความจริงของโทเคน + contrast
    tokens.css
    preview.html
    tokens-preview.png
  mockups/                  ← hi-fi ฝั่งผู้อ่าน + กฎหมาย + ช่องว่าง MVP
    *.png
    src/                    ← HTML/CSS + render.py + render-gap.py + jobs*.txt
  wireframes/               ← lo-fi นักเขียน + แอดมิน
    *.png
    src/
```

กฎหมายรวมอยู่ใน `mockups/` (โฟลเดอร์ `legal/` มี README ชี้ไปม็อก)

---

## ม็อกอัปผู้อ่าน (hi-fi · มือถือ 390×844 เป็นหลัก)

| # | หน้า | ไฟล์ PNG | ธีมสี |
|---|---|---|---|
| 1 | หน้าแรก | `home-mobile-light.png` / `home-mobile-dark.png` (+ `home-mobile.png` ม่วงเก่า) | Twilight |
| 2 | ค้นหา/หมวด | `search-mobile-light.png` (+ `search-mobile.png` ม่วงเก่า) | Twilight light |
| 3 | หน้าเรื่อง | `series-mobile-light.png` (+ `series-mobile.png` ม่วงเก่า · desktop ม่วง) | Twilight light |
| 4 | อ่านนิยาย | `read-novel-mobile-light.png` / `read-novel-mobile-dark.png` | Twilight |
| 5 | อ่านมังงะ | `read-manga-mobile.png` | ม่วงเก่า |
| 6 | Login / สมัคร | `auth-login-mobile.png` · `auth-signup-mobile.png` | ม่วงเก่า (ชื่อชั่วคราว) |
| 7 | เติมเหรียญ (mock) | `topup-mobile-light.png` (+ `topup-mobile.png` ม่วงเก่า) | Twilight light |
| 8 | ผลชำระ รอ/สำเร็จ/ล้มเหลว | `pay-*-mobile.png` | ม่วงเก่า |
| 9 | กระเป๋า + ประวัติ | `wallet-mobile-light.png` (+ `wallet-mobile.png` ม่วงเก่า) | Twilight light |
| 10 | ชั้นหนังสือ | `library-mobile.png` | ม่วงเก่า |
| 11 | ประวัติการอ่าน | `history-mobile.png` | ม่วงเก่า |

### State สำคัญ
- ยืนยันปลดล็อก: `unlock-confirm-mobile.png`
- เหรียญไม่พอ → ไปเติม: `unlock-insufficient-mobile.png`

### กฎหมาย (hi-fi สั้น)
- ข้อกำหนด: `legal-tos-mobile.png`
- ความเป็นส่วนตัว (PDPA สั้น): `legal-privacy-mobile.png`
- นโยบายเหรียญ (**คืนไม่ได้** ชัดเจน): `legal-coins-mobile.png`
- **แจ้งละเมิดลิขสิทธิ์ (takedown):** `takedown-mobile.png` ← ใหม่

### ช่องว่าง MVP ที่เติมแล้ว (รอบนี้ · Twilight Blue light)
| หน้า | ไฟล์ | หมายเหตุ |
|---|---|---|
| ศูนย์ช่วยเหลือ | `help-mobile.png` | FAQ + ลิงก์รายงาน/takedown · **ไม่มี flow คืนเหรียญ** |
| รายงานปัญหา | `report-mobile.png` | แยกจาก help · ป้ายชัดว่าไม่ใช่ฟอร์มคืนเหรียญ |
| ตั้งค่าบัญชี + PDPA สั้น | `settings-mobile.png` | โปรไฟล์ · ธีม · กฎหมาย · สิทธิ PDPA · ลบบัญชี |
| ยืนยันลบบัญชี | `settings-delete-mobile.png` | เตือนเหรียญคงเหลือคืนเงินสดไม่ได้ |
| ลืมรหัสผ่าน | `forgot-password-mobile.png` | ฟอร์มขอลิงก์ (mock) |
| ส่งลิงก์แล้ว | `forgot-password-sent-mobile.png` | state หลังส่ง · ไม่อีเมลจริง |
| โปรไฟล์สาธารณะนักเขียน | `writer-public-mobile.png` | ปก/อวาตาร์ · ชีวประวัติสั้น · รายการผลงานตัวอย่าง |

Source หน้าใหม่: `mockups/src/{help,report,takedown,settings,settings-delete,forgot-password,forgot-password-sent,writer-public}.html`  
Rebrand light: `mockups/src/{search,series,topup,wallet}-twilight.html`  
เรนเดอร์ช่องว่าง: `python3 mockups/src/render-gap.py` (jobs ใน `jobs-gap.txt` และท้าย `jobs.txt`)

---

## Wireframe นักเขียน + แอดมิน (lo-fi)

**นักเขียน** (`wireframes/wf-writer-*.png`)
- ลงทะเบียนย่อ · dashboard · รายการผลงาน · แก้ไขเรื่อง · แก้ไขตอน · รายได้+ถอน
- **โปรไฟล์สาธารณะ:** ดู hi-fi `mockups/writer-public-mobile.png` (ไม่ใช่ dashboard)

**แอดมิน** (`wireframes/wf-admin-*.png` · 1200×800)
- dashboard · ผู้ใช้ · คิวอนุมัติ · เนื้อหา/รายงาน · ธุรกรรม · คืนเงิน(มือ) · ถอนเงิน · รีพอร์ต+audit
- หมายเหตุ: คืนเงินมือในแอดมิน = เคสชำระผิดพลาดจากระบบเมื่อมี gateway — **ไม่ใช่คืนเหรียญผู้อ่านตามปกติ**

---

## ใช้ธีมใน frontend (ส้ม)

Copy `tokens/tokens.css` ได้โดยตรง และโหลด Prompt 500/600/700 กับ Sarabun 400/600 ในแอปเอง

```html
<link rel="stylesheet" href="tokens.css">
<html data-theme="light">
<main class="theme-reader-light">...</main>
<!-- หรือ .theme-reader-dark -->
```

- UI: `data-theme="light|dark"` หรือ `.theme-light` / `.theme-dark`
- Reader: `.theme-reader-light` / `.theme-reader-dark` (อิสระจาก UI)
- ปุ่มเหรียญใช้ `--on-coin` เสมอ ห้ามขาวบน champagne
- v1 alias `.theme-night` / `--c-violet-*` มีเพื่อ migration เท่านั้น

## ม็อกอัป Twilight Blue ที่เป็นแหล่งอ้างอิงสี

- `home-mobile-{light,dark}.png` · `read-novel-mobile-{light,dark}.png`
- `search-mobile-light.png` · `series-mobile-light.png` · `topup-mobile-light.png` · `wallet-mobile-light.png`
- หน้าช่องว่างทั้งหมดด้านบน (help/report/takedown/settings/forgot/writer-public) = Twilight light
- `theme-preview.png` · `tokens/tokens-preview.png`

**ม็อกอัป PNG ที่ยังม่วง/ชื่อชั่วคราว** (auth, pay-*, library, history, manga, unlock, legal บางหน้า, overview, desktop): เก็บเพื่ออ้างอิง **flow** ไม่ใช่อ้างอิงสีหรือชื่อแบรนด์ — ยังไม่ได้ re-render ครบ

## วิธี re-render และตรวจสอบ

```bash
# หน้าแรก+อ่านนิยาย light/dark + token preview
python3 design/mockups/src/render-themes.py
# ช่องว่าง MVP + search/series/topup/wallet light
python3 design/mockups/src/render-gap.py
# ม็อกเก่าทั้งชุด (ไม่จำเป็นสำหรับ rebrand)
cd design/mockups/src && python3 render.py
python3 design/tokens/validate-tokens.py
```

ตรวจภาพช่องว่างด้วยตาแล้ว ไม่พบ Thai tofu; CDP ยืนยัน Prompt SemiBold บนหัวข้อ

---

## สิ่งที่ตัดออกจาก MVP (ตั้งใจไม่ออกแบบ)
- หน้า/ปุ่ม/แบดจ์ **VIP**
- รอฟรี (wait-for-free)
- QR PromptPay / บัตรจริง (มีแต่ mock banner)
- Flow รับสมัครนักเขียนแบบละเอียด (KYC เต็ม / สัญญาเต็ม)
- **ไม่มี flow คืนเหรียญฝั่งผู้อ่าน** — มีแค่รายงานปัญหา / takedown / แอดมินคืนเงินมือกรณีชำระผิดพลาด

## ข้อค้าง / ต้องตัดสินใจต่อ
1. ชื่อผลิตภัณฑ์จริงล็อกแล้ว: **Twilight Blue** (ปิด)
2. ราคาแพ็กเหรียญจริง (ในม็อกเป็นตัวอย่าง 50/100/300)
3. ส่วนแบ่งนักเขียน + ขั้นต่ำถอน (ยังไม่ล็อก)
4. Gateway จริงเมื่อพ้น mock
5. ทนายตรวจ e-money / นโยบาย takedown ก่อนเปิดจริง
6. Re-render ม็อกม่วงที่เหลือ (auth/pay/library/history/manga/legal/desktop) ถ้าต้องการภาพ pitch สีครบ
7. Dark mode ของหน้าช่องว่างรอบนี้ **ยังไม่ทำ** (ทำแค่ light) — มี pattern จาก home/reader แล้ว
