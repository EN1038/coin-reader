import { Link, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/Badge';
import { ThemeToggle } from '../components/ThemeToggle';

export function MePage() {
  const { user, balance, logout, isMock } = useApp();
  const nav = useNavigate();

  async function onLogout() {
    await logout();
    nav('/');
  }

  return (
    <>
      <Topbar title="บัญชีของฉัน" showCoin />
      <div className="pad form-narrow">
        {user ? (
          <div className="card mb-3">
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>{user.display_name}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{user.email}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge kind="note">🪙 {balance}</Badge>
              {isMock && <Badge kind="ex">mock</Badge>}
            </div>
          </div>
        ) : (
          <div className="card mb-3 center">
            <p className="mb-3">ยังไม่ได้เข้าสู่ระบบ</p>
            <Link to="/auth/login" className="btn btn-primary btn-block">เข้าสู่ระบบ</Link>
            <Link to="/auth/signup" className="btn btn-ghost btn-block mt-2">สมัครสมาชิก</Link>
          </div>
        )}

        <div className="mb-3"><ThemeToggle /></div>

        <nav className="stack">
          {user && <Link to="/me/settings" className="card row-between">ตั้งค่าบัญชี <span>→</span></Link>}
          <Link to="/help" className="card row-between">ศูนย์ช่วยเหลือ <span>→</span></Link>
          <Link to="/wallet" className="card row-between">กระเป๋าเหรียญ <span>→</span></Link>
          <Link to="/wallet/topup" className="card row-between">เติมเหรียญ (mock) <span>→</span></Link>
          <Link to="/library" className="card row-between">ชั้นหนังสือ <span>→</span></Link>
          <Link to="/history" className="card row-between">ประวัติการอ่าน <span>→</span></Link>
          <Link to="/legal/tos" className="card row-between">ข้อกำหนดการใช้ <span>→</span></Link>
          <Link to="/legal/privacy" className="card row-between">ความเป็นส่วนตัว <span>→</span></Link>
          <Link to="/legal/coins" className="card row-between">นโยบายเหรียญ <span>→</span></Link>
          <Link to="/legal/takedown" className="card row-between">แจ้งละเมิดลิขสิทธิ์ <span>→</span></Link>
          <Link to="/writer" className="card row-between">นักเขียน (mock demo) <span>→</span></Link>
          <Link to="/admin" className="card row-between">แอดมิน (mock demo) <span>→</span></Link>
        </nav>

        {user && (
          <button type="button" className="btn btn-danger btn-block mt-4" onClick={onLogout}>
            ออกจากระบบ
          </button>
        )}
      </div>
    </>
  );
}
