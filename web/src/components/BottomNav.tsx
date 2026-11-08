import { NavLink, useLocation } from 'react-router-dom';

const items = [
  { to: '/', label: 'หน้าแรก', icon: 'home', end: true },
  { to: '/discover', label: 'ค้นพบ', icon: 'search', match: ['/discover', '/search'] },
  { to: '/ranking', label: 'อันดับ', icon: 'rank' },
  { to: '/library', label: 'ชั้นหนังสือ', icon: 'shelf', match: ['/library', '/history'] },
  { to: '/me', label: 'ฉัน', icon: 'me', match: ['/me'] },
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
  if (name === 'rank') return <svg {...common}><path d="M5 20V10M12 20V4M19 20v-7" /></svg>;
  if (name === 'shelf') return <svg {...common}><path d="M5 5h14v14H5zM5 12h14M12 5v14" /></svg>;
  return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" /></svg>;
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
          <span className="ic"><Icon name={it.icon} /></span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
