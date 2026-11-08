import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { ReferralInfo } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';

export function ReferralPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/referral'); return; }
    api.referralInfo().then(setInfo).catch((e) => setError(errMessage(e)));
  }, [user, nav]);

  const link = info ? `${window.location.origin}/auth/signup?ref=${info.code}` : '';

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied('คัดลอกไม่สำเร็จ — เลือกข้อความเอง');
    }
  }

  if (!info) return <div className="pad muted">{error || 'กำลังโหลด…'}</div>;

  return (
    <div className="referral-page">
      <div className="page-head">
        <h1>ชวนเพื่อน</h1>
        <p className="muted">ได้เหรียญ {info.percent}% ของยอดเหรียญที่เพื่อนจ่ายตอนเติม ไม่รวมเหรียญโบนัส และถอนเป็นเงินไม่ได้</p>
      </div>
      <div className="referral-hero">
        <div className="muted">รหัสของคุณ</div>
        <div className="referral-code">{info.code}</div>
        <div className="referral-actions">
          <button type="button" className="btn btn-primary" onClick={() => copy(info.code, 'คัดลอกรหัสแล้ว')}>คัดลอกรหัส</button>
          <button type="button" className="btn btn-ghost" onClick={() => copy(link, 'คัดลอกลิงก์แล้ว')}>คัดลอกลิงก์</button>
        </div>
        <p className="referral-link">{link}</p>
        {copied && <p className="ok-note">{copied}</p>}
      </div>
      <div className="card">
        <strong>เหรียญที่ได้รับจากเพื่อน {info.earned_coins}</strong>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          คิดจากเหรียญที่ซื้อด้วยเงินจำลองเท่านั้น โบนัสแพ็กไม่เข้าสูตร เหรียญส่วนนี้ใช้ปลดล็อกหรือสนับสนุนนักเขียนได้ แต่ไม่คืนและไม่โอน
        </p>
      </div>
      <h2 className="subhead">เพื่อนที่เติมแล้ว</h2>
      {info.friends.length === 0 && <p className="muted pad">ยังไม่มีเพื่อนเติมเหรียญผ่านรหัสนี้</p>}
      <div className="stack">
        {info.friends.map((f) => (
          <div key={`${f.display_name}-${f.created_at}`} className="card row-between">
            <div>
              <strong>{f.display_name}</strong>
              <div className="muted" style={{ fontSize: 12 }}>{new Date(f.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>เติมจ่าย {f.paid_coins}</div>
              <strong style={{ color: 'var(--ok)' }}>+{f.reward_coins}</strong>
            </div>
          </div>
        ))}
      </div>
      <p className="fine-print">ลองได้ด้วยบัญชี friend@example.com / demo1234 ซึ่งผูกกับรหัสนี้แล้ว ถ้าเพื่อนเติมแพ็กใหม่ เหรียญ 7% จะเข้าบัญชีที่ล็อกอินอยู่ตอนนี้เมื่อคุณคือผู้แนะนำ</p>
      <p className="pad"><Link to="/legal/coins">นโยบายเหรียญ</Link></p>
    </div>
  );
}
