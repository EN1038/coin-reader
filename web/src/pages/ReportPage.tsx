import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { useApp } from '../context/AppContext';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

const CATEGORIES = ['อ่าน / ปลดล็อก', 'เติมเหรียญ (mock)', 'บัญชี', 'อื่น ๆ'] as const;

export function ReportPage() {
  const { user, isMock } = useApp();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [email, setEmail] = useState(user?.email ?? (isMock ? 'demo@example.com' : ''));
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isMockMode) {
      setError('ฟอร์มรายงานพร้อมในโหมด mock เท่านั้น');
      return;
    }
    const blob = `${subject} ${detail}`;
    if (/คืนเหรียญ|คืนเงิน|refund|แลกเงินสด/i.test(blob)) {
      setError('ไม่ใช่แบบฟอร์มคืนเหรียญ — เหรียญคืน/แลกเงินสดไม่ได้ ดูนโยบายเหรียญ หรืออธิบายปัญหาการใช้งานอย่างเดียว');
      return;
    }
    setBusy(true);
    try {
      const row = mockDb.submitHelpReport({ category, subject, detail, email });
      setDoneId(row.id);
      setSubject('');
      setDetail('');
    } catch {
      setError('บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="รายงานปัญหา" back="/help" showCoin={false} />
      {isMock && (
        <div className="pad" style={{ paddingBottom: 0 }}>
          <MockBanner>บันทึกใน mock store · ไม่ส่งอีเมลจริง</MockBanner>
        </div>
      )}
      <div style={{ padding: '12px 16px' }}>
        <div
          className="card"
          style={{
            background: 'var(--danger-bg)',
            borderColor: '#F0C8D0',
            fontSize: 12,
            color: 'var(--danger)',
            lineHeight: 1.55,
          }}
        >
          <strong>ไม่ใช่แบบฟอร์มคืนเหรียญ</strong> — ส่งรายงานแล้วทีมจะตรวจสอบการใช้งานเท่านั้น เหรียญคืน/แลกเงินสดไม่ได้
        </div>
      </div>

      {doneId ? (
        <div className="pad form-narrow">
          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: 6 }}>รับรายงานแล้ว</p>
            <p className="muted" style={{ fontSize: 14 }}>
              รหัสอ้างอิง (mock): <code>{doneId}</code>
            </p>
            <Link to="/help" className="btn btn-primary btn-block mt-3">กลับศูนย์ช่วยเหลือ</Link>
            <button type="button" className="btn btn-ghost btn-block mt-2" onClick={() => setDoneId(null)}>
              ส่งอีกครั้ง
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="pad" style={{ paddingTop: 0 }}>
          <div className="field">
            <label>ประเภทปัญหา</label>
            <div className="report-chips">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={category === c ? 'on' : undefined}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="rep-subject">หัวข้อ</label>
            <input
              id="rep-subject"
              required
              placeholder="เช่น ปลดล็อกแล้วเปิดตอนไม่ได้"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rep-detail">รายละเอียด</label>
            <textarea
              id="rep-detail"
              required
              placeholder="บอกชื่อเรื่อง ตอน เวลาที่เกิด และสิ่งที่เห็นบนจอ (ข้อมูลตัวอย่าง)"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={{ minHeight: 110, padding: '12px 14px', resize: 'none' }}
            />
            <div className="hint">อย่าใส่รหัสผ่าน · หมายเลขบัตร · หรือเลขบัญชีเต็ม</div>
          </div>
          <div className="field">
            <label htmlFor="rep-email">อีเมลติดต่อกลับ</label>
            <input
              id="rep-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isMock && <div className="hint">บัญชี demo · ตัวอย่าง</div>}
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'กำลังส่ง…' : 'ส่งรายงาน'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ต้องการแจ้งละเมิดลิขสิทธิ์? ใช้{' '}
            <Link to="/legal/takedown" style={{ color: 'var(--primary)', fontWeight: 600 }}>ฟอร์ม takedown</Link>
          </p>
        </form>
      )}
    </>
  );
}
