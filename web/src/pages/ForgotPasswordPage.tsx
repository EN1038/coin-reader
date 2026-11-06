import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

export function ForgotPasswordPage() {
  const { isMock } = useApp();
  const [email, setEmail] = useState(isMock ? 'demo@example.com' : '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isMockMode) mockDb.requestPasswordReset(email);
      setSent(true);
    } catch {
      setError('ไม่สามารถส่งคำขอได้');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="ลืมรหัสผ่าน" back="/auth/login" showCoin={false} />
      {sent ? (
        <div className="content">
          <div className="forgot-sent">
            <div className="icon">✓</div>
            <h1 style={{ fontSize: 20, marginBottom: 8, fontFamily: 'var(--font-head)' }}>ส่งลิงก์แล้ว (mock)</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>
              ถ้ามีบัญชีที่ <strong style={{ color: 'var(--text)' }}>{email}</strong> ระบบจำลองว่าส่งลิงก์รีเซ็ตแล้ว · ใน MVP นี้ไม่ออกอีเมลจริง
            </p>
            <div style={{ marginTop: 12 }}>
              <Badge kind="ex">สถานะตัวอย่าง</Badge>
            </div>
            <Link to="/auth/login" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
              กลับเข้าสู่ระบบ
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
              onClick={() => setSent(false)}
            >
              ส่งอีกครั้ง
            </button>
          </div>
          <p style={{ textAlign: 'center', margin: '20px 24px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ไม่พบอีเมล? ตรวจสแปม หรือสมัครใหม่ · ไม่เกี่ยวกับการคืนเหรียญ
          </p>
        </div>
      ) : (
        <>
          <div className="auth-brand">
            <div className="mark">☽</div>
            <h1>รีเซ็ตรหัสผ่าน</h1>
            <p>
              กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์รีเซ็ต
              <br />
              (mock · ไม่อีเมลจริง)
            </p>
          </div>
          <form onSubmit={onSubmit} className="pad" style={{ paddingTop: 12 }}>
            <div className="field">
              <label htmlFor="forgot-email">อีเมล</label>
              <input
                id="forgot-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={busy}>
              {busy ? 'กำลังส่ง…' : 'ส่งลิงก์รีเซ็ต'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              จำรหัสได้แล้ว?{' '}
              <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                เข้าสู่ระบบ
              </Link>
            </p>
          </form>
        </>
      )}
    </>
  );
}
