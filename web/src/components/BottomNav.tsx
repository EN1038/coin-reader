import { NavLink, useLocation } from 'react-router-dom';
import { IconHome, IconRank, IconSearch, IconShelf, IconUser } from './icons';

const items = [
  { to: '/', label: 'หน้าแรก', icon: 'home', end: true },
  { to: '/discover', label: 'หมวดหมู่', icon: 'search', match: ['/discover', '/search'] },
  { to: '/ranking', label: 'อันดับ', icon: 'rank' },
  { to: '/library', label: 'คลังของฉัน', icon: 'shelf', match: ['/library', '/history'] },
  { to: '/me', label: 'โปรไฟล์', icon: 'me', match: ['/me', '/u'] },
] as const;

function NavIcon({ name }: { name: string }) {
  if (name === 'home') return <IconHome />;
  if (name === 'search') return <IconSearch size={22} />;
  if (name === 'rank') return <IconRank />;
  if (name === 'shelf') return <IconShelf />;
  return <IconUser size={22} />;
}

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottomnav" aria-label="เมนูล่าง">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={'end' in it ? it.end : false}
          className={({ isActive }) => {
            const extra = 'match' in it && it.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));
            return isActive || extra ? 'on' : undefined;
          }}
        >
          <span className="ic"><NavIcon name={it.icon} /></span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
