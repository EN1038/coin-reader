import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

export function LegalTakedownPage() {
  const { isMock } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [detail, setDetail] = useState('');
  const [evidence, setEvidence] = useState('');
  const [sworn, setSworn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isMockMode) {
      setError('แบบฟอร์มพร้อมในโหมด mock เท่านั้น');
      return;
    }
    if (!sworn) {
      setError('กรุณายืนยันคำรับรองก่อนส่ง');
      return;
    }
    setBusy(true);
    try {
      const row = mockDb.submitTakedown({
        reporter_name: name,
        reporter_email: email,
        reporter_phone: phone,
        work_url: workUrl,
        detail,
        evidence,
        sworn: true,
      });
      setDoneId(row.id);
    } catch {
      setError('บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="แจ้งละเมิดลิขสิทธิ์" back="/help" showCoin={false} />
      {isMock && (
        <div className="pad" style={{ paddingBottom: 0 }}>
          <MockBanner>เก็บใน takedownRequests (mock) · ไม่ส่งทีมกฎหมายจริง</MockBanner>
        </div>
      )}
      <div style={{ padding: '12px 16px 0' }}>
        <div
          className="card"
          style={{
            background: 'var(--note-bg)',
            borderColor: '#E8D9B8',
            fontSize: 12,
            color: 'var(--note)',
            lineHeight: 1.55,
          }}
        >
          แบบฟอร์ม notice-and-takedown ฉบับร่างออกแบบ · ต้องให้ทนายตรวจก่อนเปิดจริง ·{' '}
          <strong>ไม่คืนเหรียญ</strong> เมื่อเรื่องถูกนำออกตามนโยบายปัจจุบัน
        </div>
      </div>

      {doneId ? (
        <div className="pad form-narrow">
          <div className="card">
            <p style={{ fontWeight: 700, marginBottom: 8 }}>รับคำขอแล้ว</p>
            <p className="muted" style={{ fontSize: 14 }}>
              รหัสอ้างอิง: <code>{doneId}</code> · สถานะ: ได้รับเรื่อง (mock)
            </p>
            <Link to="/help" className="btn btn-ghost btn-block mt-3">กลับศูนย์ช่วยเหลือ</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="pad" style={{ paddingTop: 0 }}>
          <div className="sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2 style={{ fontSize: 16 }}>1. ผู้แจ้ง</h2>
            <Badge kind="ex">ตัวอย่าง</Badge>
          </div>
          <div className="field">
            <label htmlFor="td-name">ชื่อ-นามสกุล / นิติบุคคล</label>
            <input id="td-name" required placeholder="ชื่อตามบัตรหรือเอกสารสิทธิ" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="td-email">อีเมลติดต่อ</label>
            <input id="td-email" type="email" required placeholder="rights@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="td-phone">โทรศัพท์ (ถ้ามี)</label>
            <input id="td-phone" type="tel" placeholder="0xx-xxx-xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2 style={{ fontSize: 16 }}>2. เนื้อหาที่อ้างว่าละเมิด</h2>
          </div>
          <div className="field">
            <label htmlFor="td-url">URL หรือ slug เรื่อง/ตอน</label>
            <input id="td-url" required placeholder="https://…/works/… หรือชื่อเรื่อง" value={workUrl} onChange={(e) => setWorkUrl(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="td-detail">คำอธิบายสั้น ๆ</label>
            <textarea
              id="td-detail"
              required
              placeholder="ระบุงานต้นฉบับและส่วนที่ถูกใช้โดยไม่ได้รับอนุญาต"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={{ minHeight: 72, padding: '12px 14px', resize: 'none' }}
            />
          </div>
          <div className="field">
            <label htmlFor="td-ev">หลักฐาน (ลิงก์ / คำอธิบาย)</label>
            <textarea
              id="td-ev"
              placeholder="ลิงก์ต้นฉบับ เลขจดทะเบียน หรือไฟล์อ้างอิง — อัปโหลดจริงเฟสถัดไป"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              style={{ minHeight: 72, padding: '12px 14px', resize: 'none' }}
            />
          </div>

          <div className="sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2 style={{ fontSize: 16 }}>3. คำรับรอง</h2>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.55, margin: '12px 0 16px' }}>
            <input type="checkbox" checked={sworn} onChange={(e) => setSworn(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <span>
              ข้าพเจ้าเป็นเจ้าของลิขสิทธิ์หรือตัวแทนที่ได้รับมอบอำนาจ และข้อมูลที่ยื่นเป็นจริงตามที่รู้ หากเป็นเท็จข้าพเจ้ายินยอมรับผิดตามกฎหมาย
            </span>
          </label>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !sworn}>
            {busy ? 'กำลังส่ง…' : 'ส่งคำขอ takedown'}
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
            ทีมจะระงับ/ตรวจตามคิวแอดมิน · ไม่ใช่ช่องคืนเหรียญผู้อ่าน ·{' '}
            <Link to="/legal/coins" style={{ color: 'var(--primary)' }}>นโยบายเหรียญ</Link>
          </p>
        </form>
      )}
    </>
  );
}
