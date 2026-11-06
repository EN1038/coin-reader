import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MockBanner } from '../../components/MockBanner';
import { mockDb } from '../../lib/mock/store';
import { PRODUCT_NAME } from '../../lib/brand';

const NAV = [
  { to: '/writer', end: true, label: 'แดชบอร์ด' },
  { to: '/writer/works', label: 'ผลงาน' },
  { to: '/writer/payout', label: 'ถอนเงิน' },
  { to: '/writer/register', label: 'สมัคร/สถานะ' },
];

export function WriterLayout() {
  const { user, isMock } = useApp();
  const loc = useLocation();

  if (!user) {
    return (
      <div className="desk-wrap">
        <div className="card pad" style={{ maxWidth: 420, margin: '40px auto' }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>โซนนักเขียน</h1>
          <p className="muted" style={{ marginBottom: 16 }}>กรุณาเข้าสู่ระบบก่อน · บัญชี demo นักเขียน: writer@example.com / demo1234</p>
          <Link className="btn btn-primary btn-block" to={`/auth/login?next=${encodeURIComponent(loc.pathname)}`}>เข้าสู่ระบบ</Link>
          <Link className="btn btn-ghost btn-block mt-2" to="/me">กลับบัญชีของฉัน</Link>
        </div>
      </div>
    );
  }

  const author = mockDb.authorForUser(user.id);

  return (
    <div className="desk-wrap writer-shell">
      <header className="desk-top">
        <div>
          <div className="desk-brand">{PRODUCT_NAME} · นักเขียน</div>
          <div className="muted" style={{ fontSize: 12 }}>{user.display_name} · {author ? `สถานะ ${author.status}` : 'ยังไม่ใช่นักเขียน'}</div>
        </div>
        <Link to="/me" className="btn btn-ghost" style={{ minHeight: 40 }}>ออกจากโซนนักเขียน</Link>
      </header>
      {isMock && (
        <div style={{ padding: '8px 16px 0' }}>
          <MockBanner>mock writer · ตัวเลขส่วนแบ่ง/hold/ขั้นต่ำถอนเป็นตัวอย่าง · ไม่ใช่ RBAC จริง</MockBanner>
        </div>
      )}
      <nav className="desk-tabs">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="desk-body">
        <Outlet context={{ author }} />
      </div>
    </div>
  );
}

export function requireApprovedAuthor(author: ReturnType<typeof mockDb.authorForUser>) {
  if (!author) return <Navigate to="/writer/register" replace />;
  if (author.status === 'pending') {
    return (
      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>รอการอนุมัติ</h2>
        <p className="muted">ใบสมัครของคุณอยู่ระหว่างตรวจ (mock) · แอดมินอนุมัติได้ที่ /admin/authors</p>
      </div>
    );
  }
  if (author.status !== 'approved') {
    return (
      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>ยังใช้งานโซนนักเขียนไม่ได้</h2>
        <p className="muted">สถานะ: {author.status}</p>
        <Link to="/writer/register" className="btn btn-primary mt-3">ไปหน้าสมัคร</Link>
      </div>
    );
  }
  return null;
}
