import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Badge } from '../components/Badge';

const FAQS: { q: string; a: ReactNode; open?: boolean }[] = [
  {
    q: 'เติมเหรียญแล้วไม่เข้า',
    a: 'ใน MVP การเติมเป็นระบบ mock — รีเฟรชหน้ากระเป๋าหรือเข้าสู่ระบบใหม่ หากยังไม่เข้า ให้รายงานปัญหาที่หน้าแยก',
  },
  {
    q: 'ปลดล็อกแล้วอ่านไม่ได้',
    a: 'ตรวจว่าเข้าสู่ระบบด้วยบัญชีที่ปลดล็อก · เปิดตอนจากหน้าเรื่องอีกครั้ง · หากยังไม่ได้ ให้รายงานพร้อมชื่อเรื่องและตอน',
  },
  {
    q: 'ขอคืนเหรียญได้ไหม',
    a: (
      <>
        <strong style={{ color: 'var(--text)' }}>ไม่ได้</strong> — เหรียญที่เติมหรือใช้แล้วคืนไม่ได้ ไม่แลกเงินสด ไม่โอนให้ผู้อื่น ตามนโยบายที่ล็อกแล้ว ·{' '}
        <Link to="/legal/coins" style={{ color: 'var(--primary)', fontWeight: 600 }}>นโยบายเหรียญ</Link>
      </>
    ),
    open: true,
  },
  {
    q: 'เนื้อหาละเมิดลิขสิทธิ์?',
    a: (
      <>
        ใช้แบบฟอร์ม{' '}
        <Link to="/legal/takedown" style={{ color: 'var(--primary)', fontWeight: 600 }}>แจ้งละเมิดลิขสิทธิ์</Link>
        {' '}— ไม่ใช่ช่องคืนเหรียญผู้อ่าน
      </>
    ),
  },
];

export function HelpPage() {
  return (
    <>
      <Topbar title="ศูนย์ช่วยเหลือ" back showCoin={false} />
      <div style={{ padding: '10px 16px' }}>
        <div
          className="card"
          style={{
            background: 'var(--note-bg)',
            borderColor: '#E8D9B8',
            fontSize: 12,
            color: 'var(--note)',
            lineHeight: 1.5,
            padding: 12,
          }}
        >
          <strong>เหรียญคืนไม่ได้</strong> — รับรายงานปัญหาได้ · ไม่มีปุ่ม/ช่องขอคืนเหรียญหรือแลกเงินสด · ดู{' '}
          <Link to="/legal/coins" style={{ color: 'var(--note)', textDecoration: 'underline' }}>นโยบายเหรียญ</Link>
        </div>
      </div>

      <div className="sec" style={{ paddingTop: 0, paddingBottom: 6 }}>
        <h2 style={{ fontSize: 16 }}>คำถามที่พบบ่อย</h2>
        <Badge kind="ex">ตัวอย่าง</Badge>
      </div>

      {FAQS.map((f) => (
        <details key={f.q} className="faq" open={f.open}>
          <summary>
            {f.q}
            <span className="chev">▸</span>
          </summary>
          <div className="body">{f.a}</div>
        </details>
      ))}

      <div className="sec" style={{ paddingBottom: 6 }}>
        <h2 style={{ fontSize: 16 }}>ดำเนินการ</h2>
      </div>
      <div className="help-links">
        <Link to="/help/report">
          รายงานปัญหา <span>บั๊ก · อ่านไม่ได้ →</span>
        </Link>
        <Link to="/legal/takedown">
          แจ้งละเมิดลิขสิทธิ์ <span>ฟอร์ม takedown →</span>
        </Link>
        <Link to="/legal/coins">
          นโยบายเหรียญ <span>คืนไม่ได้ →</span>
        </Link>
      </div>
    </>
  );
}
