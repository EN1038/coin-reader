import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { useApp, errMessage } from '../context/AppContext';
import { MockBanner } from '../components/MockBanner';
import { PRODUCT_NAME } from '../lib/brand';

export function LoginPage() {
  const { login, isMock } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/';
  const [email, setEmail] = useState(isMock ? 'demo@example.com' : '');
  const [password, setPassword] = useState(isMock ? 'demo1234' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav(next);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="เข้าสู่ระบบ" back="/" showCoin={false} />
      <div className="pad">
        <p className="center head" style={{ fontSize: 22, marginBottom: 4 }}>{PRODUCT_NAME}</p>
        <p className="center muted" style={{ fontSize: 13, marginBottom: 16 }}>อ่านนิยายและมังงะ · ปลดล็อกด้วยเหรียญ</p>
        {isMock && (
          <div className="mb-3">
            <MockBanner>บัญชีตัวอย่าง: demo@example.com / demo1234 · ยอดเริ่ม 248 เหรียญ</MockBanner>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div className="stack mt-4">
          <button type="button" className="btn btn-ghost btn-block" onClick={() => alert('ยังไม่เชื่อมต่อ Google ใน MVP mock')}>
            ดำเนินการต่อด้วย Google
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => alert('ยังไม่เชื่อมต่อ LINE ใน MVP mock')}>
            ดำเนินการต่อด้วย LINE
          </button>
        </div>
        <p className="center muted mt-4" style={{ fontSize: 14 }}>
          ยังไม่มีบัญชี? <Link to={`/auth/signup?next=${encodeURIComponent(next)}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>สมัคร</Link>
        </p>
      </div>
    </>
  );
}
