import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CoinPill } from './CoinPill';
import { PRODUCT_NAME } from '../lib/brand';
import { useApp } from '../context/AppContext';

const LINKS = [
  { to: '/', label: 'หน้าแรก', end: true },
  { to: '/discover', label: 'ค้นพบ' },
  { to: '/ranking', label: 'อันดับ' },
  { to: '/library', label: 'ชั้นหนังสือ' },
];

export function ReaderHeader() {
  const nav = useNavigate();
  const { user } = useApp();
  const [q, setQ] = useState('');
  const initial = user?.display_name?.trim().slice(0, 1) || '?';

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    nav(query ? `/discover?q=${encodeURIComponent(query)}` : '/discover');
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand-mark" aria-label={PRODUCT_NAME}>
          <span className="brand-glyph" aria-hidden>TB</span>
          <span className="brand-name">{PRODUCT_NAME}</span>
        </Link>
        <nav className="desk-nav" aria-label="หลัก">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <form className="header-search" onSubmit={onSearch}>
          <span aria-hidden>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาเรื่อง นักเขียน หมวด"
            aria-label="ค้นหา"
          />
        </form>
        <div className="header-tools">
          <Link to="/discover" className="icon-btn header-search-btn" aria-label="ค้นหา">⌕</Link>
          {user ? (
            <>
              <CoinPill />
              <Link to="/wallet/topup" className="btn btn-coin btn-sm topup-link">เติม</Link>
            </>
          ) : (
            <Link to="/auth/login" className="btn btn-primary btn-sm topup-link">เข้าสู่ระบบ</Link>
          )}
          <Link to="/me" className="avatar-btn" aria-label="โปรไฟล์">{initial}</Link>
        </div>
      </div>
    </header>
  );
}
