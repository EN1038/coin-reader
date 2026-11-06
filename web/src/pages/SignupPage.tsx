import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { useApp, errMessage } from '../context/AppContext';
import { MockBanner } from '../components/MockBanner';
import { PRODUCT_NAME } from '../lib/brand';

export function SignupPage() {
  const { signup, isMock } = useApp();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') || '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup(email, password, name);
      nav(next);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="สมัครสมาชิก" back showCoin={false} />
      <div className="pad form-narrow">
        <p className="center head" style={{ fontSize: 22, marginBottom: 4 }}>{PRODUCT_NAME}</p>
        <p className="center muted" style={{ fontSize: 13, marginBottom: 16 }}>สร้างบัญชีเพื่อปลดล็อกและเก็บชั้นหนังสือ</p>
        {isMock && <div className="mb-3"><MockBanner>สมัครใน mock เก็บในเครื่องคุณเท่านั้น</MockBanner></div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">ชื่อที่แสดง</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}
          </button>
        </form>
        <p className="center muted mt-4" style={{ fontSize: 14 }}>
          มีบัญชีแล้ว? <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>เข้าสู่ระบบ</Link>
        </p>
        <p className="ex center mt-3">การสมัครถือว่ายอมรับ <Link to="/legal/tos">ข้อกำหนด</Link> และ <Link to="/legal/privacy">ความเป็นส่วนตัว</Link></p>
      </div>
    </>
  );
}
