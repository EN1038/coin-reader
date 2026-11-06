import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { useApp } from '../context/AppContext';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

export function DeleteAccountPage() {
  const { user, logout, isMock } = useApp();
  const nav = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <>
        <Topbar title="ลบบัญชี" back="/me/settings" showCoin={false} />
        <div className="pad form-narrow">
          <div className="card center">
            <p className="mb-3">กรุณาเข้าสู่ระบบก่อน</p>
            <Link to="/auth/login?next=/me/settings/delete" className="btn btn-primary btn-block">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </>
    );
  }

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (confirmText.trim() !== 'DELETE') {
      setError('พิมพ์ DELETE ให้ตรงทุกตัวอักษร');
      return;
    }
    if (!isMockMode) {
      setError('ลบบัญชีได้ในโหมด mock เท่านั้นตอนนี้');
      return;
    }
    setBusy(true);
    try {
      mockDb.deleteAccount(password);
      await logout();
      nav('/auth/login');
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_PASSWORD') {
        setError('รหัสผ่านไม่ถูกต้อง');
      } else {
        setError('ลบไม่สำเร็จ');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="ลบบัญชี" back="/me/settings" showCoin={false} />
      {isMock && (
        <div className="pad" style={{ paddingBottom: 0 }}>
          <MockBanner>ตัวอย่าง flow · ทำเครื่องหมายลบบัญชีใน localStorage</MockBanner>
        </div>
      )}
      <div className="pad">
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>ยืนยันการลบบัญชี</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          การดำเนินการนี้ปิดบัญชี Twilight Blue ของคุณ (ตัวอย่าง flow · ยังไม่ลบข้อมูลจริงในม็อก)
        </p>
        <div
          style={{
            margin: '12px 0 16px',
            padding: 14,
            borderRadius: 14,
            background: 'var(--danger-bg)',
            border: '1px solid #F0C8D0',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--danger)',
          }}
        >
          <strong>สิ่งที่จะเกิดหลังยืนยัน</strong>
          <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            <li>เข้าสู่ระบบด้วยอีเมลนี้ไม่ได้</li>
            <li>ชั้นหนังสือและประวัติการอ่านเข้าไม่ได้</li>
            <li>เหรียญคงเหลือ <u>ไม่คืนเป็นเงินสด</u> และใช้ต่อไม่ได้</li>
          </ul>
        </div>
        <form onSubmit={onDelete}>
          <div className="field">
            <label htmlFor="del-confirm">พิมพ์ DELETE เพื่อยืนยัน</label>
            <input
              id="del-confirm"
              required
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="del-pass">รหัสผ่าน</label>
            <input
              id="del-pass"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            className="btn btn-danger btn-block"
            style={{ marginTop: 8 }}
            disabled={busy || confirmText.trim() !== 'DELETE'}
          >
            {busy ? 'กำลังลบ…' : 'ลบบัญชีถาวร'}
          </button>
          <Link to="/me/settings" className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
            ยกเลิก
          </Link>
        </form>
      </div>
    </>
  );
}
