# Twilight Blue — Design system v2 (MVP)

**เซน · 6 พ.ย. 2569**  
**ชื่อผลิตภัณฑ์:** Twilight Blue · ชื่อจริงตามการตัดสินใจล่าสุด · path เดิม `coin-reader` ไม่เปลี่ยน  
อ้างอิงแผน: `/workspace/projects/coin-reader/plan.md`

## สไตล์โดยสรุป
- แอปอ่านมือถือเป็นหลัก · **ไม่ใช้ sticky scrollytelling**
- ธีมสนธยา: dusk blue `#3D5A80` + indigo `#2E4666` เป็นแบรนด์หลัก; lavender เป็นรอง เหรียญใช้ champagne `#DDC89D` + ink `#3F3523` ไม่ใช้ทองเป็นแบรนด์หลัก
- UI Light: พื้น cool paper `#F3F6FA`, ข้อความ `#1C2C40` · UI Dark: navy `#101827`, ข้อความ `#E7EDF5`, primary `#A6C5ED`
- Reader Light: paper ฟ้าเทา `#F0F3F4` / ink `#293644` · Reader Dark: night `#0F171E` / off-white `#DCE2E6` · Sarabun 18px, lh **1.85 ขึ้นไป**, บรรทัดไม่เกิน 65ch
- ฟอนต์: Prompt (หัวข้อ) · Sarabun (เนื้อหา) · มี Noto Sans Thai เป็น fallback
- Contrast: ตรวจ **76 คู่ semantic จริง** จาก sRGB ตาม WCAG 2.x; ค่าต่ำสุด 5.05:1 (AA normal text ≥4.5) — ดู `tokens/tokens.json` → `contrast_AA_checked` เฉพาะคู่ที่ระบุ ไม่เหมารวมม็อกอัปเก่าหรือสีโปร่งใส

## ข้อจำกัด MVP ที่ยึดในการออกแบบ
| หัวข้อ | การตัดสินใจ | สะท้อนในดีไซน์ |
|---|---|---|
| Payment | **mock** | แบนเนอร์เตือนทุกหน้าเติม/ผลชำระ · ไม่มี QR จริง |
| เหรียญ | **คืนไม่ได้** | นโยบายเหรียญ + ข้อความใน topup / unlock / wallet |
| VIP | เฟส 2 | **ไม่มี** หน้า/ปุ่ม/แบดจ์ VIP |
| รอฟรี | เฟส 2 | ไม่มีในสารบัญ |
| หานักเขียน | ทีมอื่น | writer = wireframe ย่อ ไม่ทำ flow สมัครละเอียด |

ข้อมูลปก/ชื่อเรื่อง/นักเขียน/ราคาเหรียญในม็อก = **ตัวอย่าง** ติดป้ายทุกจุด  
ส่วนแบ่งนักเขียนยังไม่ล็อกผลิตภัณฑ์ — ใน wireframe ระบุว่าตลาด 50–72% จากแผน (ข้อมูลคู่แข่ง)

---

## โครงสร้างไฟล์

```
design/
  README.md                 ← ไฟล์นี้
  overview.png              ← ภาพรวมม็อกอัปผู้อ่านหลัก
  tokens/
    tokens.json             ← แหล่งความจริงของโทเคน + contrast
    tokens.css
    preview.html
    tokens-preview.png
  mockups/                  ← hi-fi ฝั่งผู้อ่าน + กฎหมาย
    *.png
    src/                    ← HTML/CSS + render.py + jobs.txt
  wireframes/               ← lo-fi นักเขียน + แอดมิน
    *.png
    src/
```

กฎหมายรวมอยู่ใน `mockups/` (ไม่แยกโฟลเดอร์ legal/)

---

## ม็อกอัปผู้อ่าน (hi-fi · มือถือ 390×844 เป็นหลัก)

| # | หน้า | ไฟล์ PNG |
|---|---|---|
| 1 | หน้าแรก | `mockups/home-mobile.png` (+ `home-desktop.png`) |
| 2 | ค้นหา/หมวด | `search-mobile.png` |
| 3 | หน้าเรื่อง | `series-mobile.png` (+ `series-desktop.png`) |
| 4 | อ่านนิยาย (dark) | `read-novel-mobile.png` (+ `read-novel-desktop.png`) |
| 5 | อ่านมังงะ (dark + watermark ตัวอย่าง) | `read-manga-mobile.png` |
| 6 | Login / สมัคร | `auth-login-mobile.png` · `auth-signup-mobile.png` |
| 7 | เติมเหรียญ (mock) | `topup-mobile.png` |
| 8 | ผลชำระ รอ/สำเร็จ/ล้มเหลว | `pay-pending-mobile.png` · `pay-success-mobile.png` · `pay-fail-mobile.png` |
| 9 | กระเป๋า + ประวัติธุรกรรม | `wallet-mobile.png` |
| 10 | ชั้นหนังสือ | `library-mobile.png` |
| 11 | ประวัติการอ่าน | `history-mobile.png` |

### State สำคัญ
- ยืนยันปลดล็อก (ราคา + ยอดหลังหัก): `unlock-confirm-mobile.png`
- เหรียญไม่พอ → ไปเติม: `unlock-insufficient-mobile.png`

### กฎหมาย (hi-fi สั้น)
- ข้อกำหนด: `legal-tos-mobile.png`
- ความเป็นส่วนตัว (PDPA สั้น): `legal-privacy-mobile.png`
- นโยบายเหรียญ (**คืนไม่ได้** ชัดเจน): `legal-coins-mobile.png`

Login รองรับอีเมล / Google / LINE ตามแผน

---

## Wireframe นักเขียน + แอดมิน (lo-fi)

**นักเขียน** (`wireframes/wf-writer-*.png`)
- ลงทะเบียนย่อ · dashboard · รายการผลงาน · แก้ไขเรื่อง · แก้ไขตอน · รายได้+ถอน

**แอดมิน** (`wireframes/wf-admin-*.png` · 1200×800)
- dashboard · ผู้ใช้ · คิวอนุมัติ · เนื้อหา/รายงาน · ธุรกรรม · คืนเงิน(มือ) · ถอนเงิน · รีพอร์ต+audit

---

## ใช้ธีมใน frontend (ส้ม)

Copy `tokens/tokens.css` ได้โดยตรง และโหลด Prompt 500/600/700 กับ Sarabun 400/600 ในแอปเอง (ไฟล์นี้ไม่ดึง Google Fonts อัตโนมัติ)

```html
<link rel="stylesheet" href="tokens.css">
<html data-theme="light"> <!-- ค่าเริ่มต้น :root เป็น light -->
<!-- เปลี่ยนเป็น data-theme="dark" เมื่อเลือกโหมดมืด -->
<main class="theme-reader-light">...</main>
<!-- หรือ .theme-reader-dark: โหมดหน้าอ่านเป็นอิสระจาก UI -->
```

```css
body { background:var(--bg); color:var(--text); font-family:var(--font-body); }
.card { background:var(--surface); border:1px solid var(--line); }
.btn-primary { background:var(--primary); color:var(--on-primary); }
.btn-coin { background:var(--accent-coin); color:var(--on-coin); }
.coin-chip { background:var(--coin-bg); color:var(--coin-text); }
.novel { font-family:var(--font-body); font-size:var(--fs-reader);
  line-height:var(--lh-reader); max-width:65ch; }
```

- UI: `data-theme="light|dark"` หรือ `.theme-light` / `.theme-dark` บน html/body/container
- Reader: `.theme-reader-light` / `.theme-reader-dark` บนพื้นที่อ่าน (มี semantic ครบชุด; override ธีม UI ได้)
- อย่าวาง UI light/dark และ reader class บน element เดียวกัน ให้ reader อยู่ด้านใน; เปลี่ยนธีมโดยเปลี่ยน attribute/class ไม่ reload
- v1 alias `.theme-night` = dark UI, `.theme-reader` = reader dark; `--c-violet-*` เป็น alias สีฟ้าเพื่อ migration เท่านั้น ไม่ใช่ palette ใหม่ ควรใช้ semantic vars
- อย่าใช้ `--c-ink` สำหรับปุ่มเหรียญใน dark: ใช้ `--on-coin` เสมอ ห้ามขาวบน champagne
- การจำค่าธีม/เลือกตามระบบเป็นหน้าที่ frontend; CSS tokens ไม่เขียน localStorage และไม่บังคับ prefers-color-scheme
- focus ring ใช้ `--focus`; contrast ต้องตรวจซ้ำหากมี opacity/overlay หรือเพิ่มคู่ใหม่

## ม็อกอัป Twilight Blue รอบใหม่ (ใช้เป็นแหล่งอ้างอิงสี)

- `mockups/home-mobile-light.png` / `home-mobile-dark.png` — หน้าแรก 390×844
- `mockups/read-novel-mobile-light.png` / `read-novel-mobile-dark.png` — นิยาย 390×844
- `theme-preview.png` — เทียบ 4 จอ
- `tokens/tokens-preview.png` — สี, component และ reader ทั้งสองโหมด
- Source: `mockups/src/home-twilight.html`, `read-novel-twilight.html`, `twilight.css` (ใช้ tokens ใหม่); เติม `?theme=light` หรือ `?theme=dark`

**ม็อกอัป PNG ส่วนใหญ่, overview.png และ source v1 ที่ไม่ลงท้าย twilight ยังเป็นม่วง/ชื่อชั่วคราวจากรอบก่อน เก็บเพื่ออ้างอิง flow ไม่ใช่อ้างอิงสีหรือชื่อแบรนด์ปัจจุบัน** ยังไม่ได้ re-render ครบทุกหน้า รวม desktop, manga, payment และ wireframes. Source v1 ที่ import tokens.css จะรับค่าใหม่บางส่วนแต่ยังมีสี hard-code จึงห้ามนำไปใช้โดยไม่ migrate.

## วิธี re-render และตรวจสอบ

ต้องมี Python Playwright + Google Chrome (`/usr/bin/google-chrome`) และฟอนต์ Prompt/Sarabun ในเครื่อง

```bash
# 4 theme mocks + tokens preview + actual Thai font selection report
python3 design/mockups/src/render-themes.py
# recompute exact contrast, fail if below 4.5
python3 design/tokens/validate-tokens.py
# เฉพาะม็อกเก่า (รอบก่อน; ไม่จำเป็นต้องรันสำหรับ rebrand)
cd design/mockups/src && python3 render.py
```

ตรวจภาพใหม่ทั้ง 4 ภาพและ token preview ด้วยตาแล้ว ไม่พบ Thai tofu; CDP ยืนยัน Prompt SemiBold/Sarabun จริง, reader 18px / 33.3px = 1.85, ไม่เกิด horizontal page overflow. รายงาน `tokens/render-checks.json` (ตรวจ overflow ทั้งหน้า ไม่รวม rail ที่เลื่อนแนวนอนได้โดยตั้งใจ).

รายการจอบอยู่ใน `jobs.txt` ของแต่ละโฟลเดอร์

---

## สิ่งที่ตัดออกจาก MVP (ตั้งใจไม่ออกแบบ)
- หน้า/ปุ่ม/แบดจ์ **VIP**
- รอฟรี (wait-for-free)
- QR PromptPay / บัตรจริง
- Flow รับสมัครนักเขียนแบบละเอียด (KYC เต็ม รูปแบบสัญญาเต็ม)
- ศูนย์ช่วยเหลือ / ฟอร์มแจ้งละเมิดลิขสิทธิ์แยก (แผนมี — ยังไม่ทำในรอบดีไซน์นี้ ถ้าต้องการเป็น P0 บอกได้)
- ตั้งค่าบัญชี/ลบบัญชี/PDPA แบบฟอร์มเต็ม

## ข้อค้าง / ต้องตัดสินใจต่อ
1. ชื่อผลิตภัณฑ์จริงล็อกแล้ว: **Twilight Blue** (ปิดรายการนี้)
2. ราคาแพ็กเหรียญจริง (ในม็อกเป็นตัวอย่าง 50/100/300/500)
3. ส่วนแบ่งนักเขียน + ขั้นต่ำถอน (ยังไม่ล็อก — อย่าอ้างเป็นของผลิตภัณฑ์)
4. Gateway จริงเมื่อพ้น mock (Stripe / Beam / Omise — ตามแผน)
5. ทนายตรวจ e-money / นโยบาย takedown ก่อนเปิดจริง
