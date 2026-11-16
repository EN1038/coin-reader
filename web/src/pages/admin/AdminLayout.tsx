import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { MockBanner } from '../../components/MockBanner';
import { PRODUCT_NAME } from '../../lib/brand';
import { BrandLogo } from '../../components/BrandAssets';
import { mockDb } from '../../lib/mock/store';
import { profilePathFor } from '../../lib/profileSlug';
import {
  IconBook,
  IconClock,
  IconCoin,
  IconDiamond,
  IconFolder,
  IconGhost,
  IconHome,
  IconSearch,
  IconThumbsUp,
  IconUser,
} from '../../components/icons';

type NavItem = {
  to: string;
  end?: boolean;
  label: string;
  icon: ReactNode;
  badgeKey?: 'authors' | 'payouts' | 'reports' | 'takedowns';
};

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'ภาพรวม',
    items: [
      { to: '/admin', end: true, label: 'Dashboard', icon: <IconHome size={16} /> },
      { to: '/admin/activity', label: 'บันทึกอัปเดต', icon: <IconClock size={16} /> },
    ],
  },
  {
    title: 'เนื้อหา',
    items: [
      { to: '/admin/works', label: 'ผลงาน', icon: <IconBook size={16} /> },
      { to: '/admin/categories', label: 'หมวดหมู่', icon: <IconFolder size={16} /> },
      { to: '/admin/banners', label: 'แบนเนอร์', icon: <IconThumbsUp size={16} /> },
      { to: '/admin/assets', label: 'ภาพเริ่มต้น', icon: <IconSearch size={16} /> },
    ],
  },
  {
    title: 'คน',
    items: [{ to: '/admin/authors', label: 'คิวนักแปล', icon: <IconUser size={16} />, badgeKey: 'authors' }],
  },
  {
    title: 'เงิน',
    items: [
      { to: '/admin/ledger', label: 'ธุรกรรม Gold', icon: <IconCoin size={16} /> },
      { to: '/admin/payouts', label: 'ถอน Diamond', icon: <IconDiamond size={16} />, badgeKey: 'payouts' },
      { to: '/admin/refunds', label: 'คืนเงิน', icon: <IconThumbsUp size={16} /> },
    ],
  },
  {
    title: 'ความปลอดภัย',
    items: [
      { to: '/admin/reports', label: 'รายงาน', icon: <IconSearch size={16} />, badgeKey: 'reports' },
      { to: '/admin/takedowns', label: 'Takedown', icon: <IconGhost size={16} />, badgeKey: 'takedowns' },
    ],
  },
];

export function AdminLayout() {
  const { user, isMock } = useApp();
  const loc = useLocation();
  const s = user ? mockDb.adminSummary() : null;
  const badges = {
    authors: s?.authors_pending ?? 0,
    payouts: s?.payouts_pending ?? 0,
    reports: s?.reports_open ?? 0,
    takedowns: s?.takedowns_open ?? 0,
  };

  if (!user) {
    return (
      <div className="desk-wrap">
        <div className="card pad" style={{ maxWidth: 420, margin: '40px auto' }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>โซนแอดมิน</h1>
          <p className="muted" style={{ marginBottom: 16 }}>เข้าสู่ระบบเพื่อเปิด mock admin · ไม่มี RBAC จริงใน MVP</p>
          <Link className="btn btn-primary btn-block" to={`/auth/login?next=${encodeURIComponent(loc.pathname)}`}>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="desk-wrap admin-shell">
      <aside className="admin-side">
        <div className="admin-side-brand">
          <BrandLogo size="sm" />
          <div>
            <strong>ADMIN</strong>
            <span>{PRODUCT_NAME}</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="admin-nav-group">
              <div className="admin-nav-label">{g.title}</div>
              {g.items.map((n) => {
                const count = n.badgeKey ? badges[n.badgeKey] : 0;
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) => `admin-nav-link${isActive ? ' on' : ''}`}
                  >
                    <span className="admin-nav-ic">{n.icon}</span>
                    <span className="admin-nav-text">{n.label}</span>
                    {count > 0 && <span className="admin-nav-badge">{count}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <Link to={user ? profilePathFor(user) : '/me'} className="admin-side-exit">← กลับผู้อ่าน</Link>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <div>
            <div className="desk-brand">แอดมิน CMS</div>
            <div className="muted" style={{ fontSize: 12 }}>{user.email} · mock</div>
          </div>
          <div className="admin-top-actions">
            <Link to="/admin/categories" className="btn btn-ghost btn-sm">หมวดหมู่</Link>
            <Link to="/admin/works" className="btn btn-primary btn-sm">ผลงาน</Link>
          </div>
        </header>
        {isMock && (
          <div className="admin-banner-wrap">
            <MockBanner>mock admin · ไม่ใช่ authorization จริง · บัญชีใดก็เปิดได้เมื่อล็อกอิน</MockBanner>
          </div>
        )}
        <div className="admin-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
