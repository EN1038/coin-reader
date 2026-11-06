import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MockBanner } from '../../components/MockBanner';
import { PRODUCT_NAME } from '../../lib/brand';

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/authors', label: 'คิวอนุมัติ' },
  { to: '/admin/works', label: 'เนื้อหา' },
  { to: '/admin/reports', label: 'รายงาน' },
  { to: '/admin/takedowns', label: 'Takedown' },
  { to: '/admin/ledger', label: 'ธุรกรรม' },
  { to: '/admin/payouts', label: 'ถอนเงิน' },
  { to: '/admin/refunds', label: 'คืนเงิน' },
];

export function AdminLayout() {
  const { user, isMock } = useApp();
  const loc = useLocation();

  if (!user) {
    return (
      <div className="desk-wrap">
        <div className="card pad" style={{ maxWidth: 420, margin: '40px auto' }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>โซนแอดมิน</h1>
          <p className="muted" style={{ marginBottom: 16 }}>เข้าสู่ระบบเพื่อเปิด mock admin · ไม่มี RBAC จริงใน MVP</p>
          <Link className="btn btn-primary btn-block" to={`/auth/login?next=${encodeURIComponent(loc.pathname)}`}>เข้าสู่ระบบ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="desk-wrap admin-shell">
      <aside className="admin-side">
        <div className="admin-side-brand">ADMIN · {PRODUCT_NAME}</div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/me" className="admin-side-exit">← กลับผู้อ่าน</Link>
      </aside>
      <div className="admin-main">
        <header className="desk-top" style={{ borderRadius: 0 }}>
          <div>
            <div className="desk-brand">แอดมิน (mock)</div>
            <div className="muted" style={{ fontSize: 12 }}>{user.email}</div>
          </div>
        </header>
        {isMock && (
          <div style={{ padding: '8px 16px 0' }}>
            <MockBanner>mock admin · ตัวอย่าง — ไม่ใช่ authorization จริง · บัญชีใดก็เปิดได้เมื่อล็อกอิน</MockBanner>
          </div>
        )}
        <div className="desk-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
