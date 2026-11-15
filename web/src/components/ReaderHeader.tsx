import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CoinPill } from './CoinPill';
import { IconBell, IconSearch, IconUser } from './icons';
import { PRODUCT_NAME } from '../lib/brand';
import { BrandLogo } from './BrandAssets';
import { ThemeToggle } from './ThemeToggle';
import { useApp } from '../context/AppContext';

const LINKS = [
  { to: '/', label: 'หน้าแรก', end: true },
  { to: '/discover', label: 'หมวดหมู่' },
  { to: '/ranking', label: 'อันดับยอดนิยม' },
  { to: '/discover?sort=updated', label: 'อัปเดตล่าสุด', matchPath: '/discover' },
  { to: '/library', label: 'คอลเลกชัน' },
];

export function ReaderHeader() {
  const nav = useNavigate();
  const { user } = useApp();
  const [q, setQ] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const initial = user?.display_name?.trim().slice(0, 1).toUpperCase() || '';

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    nav(query ? `/discover?q=${encodeURIComponent(query)}` : '/discover');
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-mark" aria-label={PRODUCT_NAME}>
          <BrandLogo size="md" className="header-logo" />
        </Link>

        <nav className="desk-nav" aria-label="หลัก">
          {LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={'end' in l ? l.end : false}
              className={({ isActive }) => (isActive ? 'on' : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form className="header-search" onSubmit={onSearch}>
          <IconSearch className="header-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาเรื่อง นักเขียน หมวด"
            aria-label="ค้นหา"
          />
        </form>

        <div className="header-tools">
          <Link to="/discover" className="icon-btn header-search-btn" aria-label="ค้นหา">
            <IconSearch size={20} />
          </Link>
          <ThemeToggle compact />
          <div className="notify-wrap">
            <button
              type="button"
              className="icon-btn"
              aria-label="การแจ้งเตือน"
              aria-expanded={notifyOpen}
              onClick={() => setNotifyOpen((v) => !v)}
            >
              <IconBell size={20} />
            </button>
            {notifyOpen && (
              <div className="notify-pop" role="dialog" aria-label="การแจ้งเตือน">
                <p>ยังไม่มีการแจ้งเตือนใหม่</p>
                <Link to="/check-in" onClick={() => setNotifyOpen(false)}>ไปเช็คอินรายวัน</Link>
              </div>
            )}
          </div>
          {user ? (
            <>
              <CoinPill />
              <Link to="/wallet/topup" className="btn btn-coin btn-sm topup-link">เติม</Link>
              <Link to="/me" className="avatar-btn" aria-label="โปรไฟล์">
                {initial || <IconUser size={16} />}
              </Link>
            </>
          ) : (
            <Link to="/auth/login" className="btn btn-primary btn-sm topup-link header-login">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
