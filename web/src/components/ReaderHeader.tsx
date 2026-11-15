import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CoinPill } from './CoinPill';
import {
  CategoryIcon,
  IconBell,
  IconChevronDown,
  IconFolder,
  IconHome,
  IconSearch,
  IconShelf,
  IconTrophy,
  IconUser,
  IconZap,
} from './icons';
import { PRODUCT_NAME } from '../lib/brand';
import { BrandLogo } from './BrandAssets';
import { ThemeToggle } from './ThemeToggle';
import { UserAvatar } from './UserAvatar';
import { useApp } from '../context/AppContext';
import { api, isMockMode } from '../lib/supabase';
import type { Category } from '../lib/types';
import { mockDb } from '../lib/mock/store';
import { relativeTime } from '../lib/format';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
  activeWhen?: (pathname: string, search: string) => boolean;
};

const LINKS: NavItem[] = [
  {
    to: '/ranking',
    label: 'อันดับ',
    icon: <IconTrophy size={16} className="desk-nav-ic" />,
  },
  {
    to: '/discover?sort=updated',
    label: 'อัปเดตล่าสุด',
    icon: <IconZap size={16} className="desk-nav-ic" />,
    activeWhen: (pathname, search) =>
      pathname.startsWith('/discover') && new URLSearchParams(search).get('sort') === 'updated',
  },
  {
    to: '/library',
    label: 'คอลเลกชัน',
    icon: <IconShelf size={16} className="desk-nav-ic" />,
  },
];

export function ReaderHeader() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const [q, setQ] = useState('');
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifyTick, setNotifyTick] = useState(0);
  const catsRef = useRef<HTMLDivElement>(null);
  const notifications = user && isMockMode ? mockDb.listNotifications(user.id) : [];
  const unread = user && isMockMode ? mockDb.unreadNotificationCount(user.id) : 0;
  void notifyTick;

  const catParam = new URLSearchParams(location.search).get('category') || '';
  const catsActive =
    location.pathname.startsWith('/discover') &&
    new URLSearchParams(location.search).get('sort') !== 'updated';

  useEffect(() => {
    let alive = true;
    api.listCategories(true)
      .then((list) => {
        if (alive) setCategories(list);
      })
      .catch(() => {
        if (alive) setCategories([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setCatsOpen(false);
    setNotifyOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!catsOpen) return;
    function onDoc(e: MouseEvent) {
      if (!catsRef.current?.contains(e.target as Node)) setCatsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCatsOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [catsOpen]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    nav(query ? `/discover?q=${encodeURIComponent(query)}` : '/discover');
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-mark" aria-label={PRODUCT_NAME}>
          <BrandLogo variant="topbar" size="md" className="header-logo" />
        </Link>

        <nav className="desk-nav" aria-label="หลัก">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'on' : undefined)}
          >
            <IconHome size={16} className="desk-nav-ic" />
            <span>หน้าแรก</span>
          </NavLink>

          <div className={`desk-nav-dd${catsOpen ? ' open' : ''}`} ref={catsRef}>
            <button
              type="button"
              className={`desk-nav-trigger${catsActive ? ' on' : ''}`}
              aria-expanded={catsOpen}
              aria-haspopup="menu"
              onClick={() => {
                setNotifyOpen(false);
                setCatsOpen((v) => !v);
              }}
            >
              <IconFolder size={16} className="desk-nav-ic" />
              <span>หมวดหมู่</span>
              <IconChevronDown size={14} className="desk-nav-chevron" />
            </button>
            {catsOpen && (
              <div className="desk-nav-menu" role="menu" aria-label="หมวดหมู่">
                <Link
                  to="/discover"
                  role="menuitem"
                  className={!catParam ? 'on' : undefined}
                  onClick={() => setCatsOpen(false)}
                >
                  <IconFolder size={15} className="desk-nav-menu-ic" />
                  ทั้งหมด
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/discover?category=${encodeURIComponent(cat.name)}`}
                    role="menuitem"
                    className={catParam === cat.name ? 'on' : undefined}
                    onClick={() => setCatsOpen(false)}
                  >
                    <CategoryIcon name={cat.icon_key} size={15} className="desk-nav-menu-ic" />
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={l.end}
              className={({ isActive }) => {
                const on = l.activeWhen
                  ? l.activeWhen(location.pathname, location.search)
                  : isActive;
                return on ? 'on' : undefined;
              }}
            >
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <form className="header-search" onSubmit={onSearch}>
          <IconSearch className="header-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อเรื่อง, ผู้เขียน, แท็ก..."
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
              className="icon-btn header-tool-btn"
              aria-label="การแจ้งเตือน"
              aria-expanded={notifyOpen}
              onClick={() => {
                setCatsOpen(false);
                const next = !notifyOpen;
                setNotifyOpen(next);
                if (next && user && isMockMode) {
                  mockDb.markNotificationsRead(user.id);
                  setNotifyTick((n) => n + 1);
                }
              }}
            >
              <IconBell size={20} />
              {unread > 0 && <span className="notify-dot" aria-hidden>{unread > 9 ? '9+' : unread}</span>}
            </button>
            {notifyOpen && (
              <div className="notify-pop" role="dialog" aria-label="การแจ้งเตือน">
                {notifications.length ? (
                  <ul className="notify-list">
                    {notifications.slice(0, 8).map((n) => (
                      <li key={n.id}>
                        <strong>{n.title}</strong>
                        <p>{n.body}</p>
                        <span>{relativeTime(n.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>ยังไม่มีการแจ้งเตือนใหม่</p>
                )}
                <Link to="/check-in" onClick={() => setNotifyOpen(false)}>ไปเช็คอินรายวัน</Link>
              </div>
            )}
          </div>
          {user ? (
            <>
              <CoinPill />
              <Link to="/wallet/topup" className="btn btn-coin btn-sm topup-link">เติม</Link>
              <Link to="/me" className="avatar-btn" aria-label="โปรไฟล์">
                {user ? (
                  <UserAvatar name={user.display_name} src={user.avatar_url} className="avatar-btn-img" />
                ) : (
                  <IconUser size={16} />
                )}
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
