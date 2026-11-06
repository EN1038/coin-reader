import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'หน้าแรก', ic: '⌂', end: true },
  { to: '/search', label: 'ค้นหา', ic: '⌕' },
  { to: '/library', label: 'ชั้นหนังสือ', ic: '▤' },
  { to: '/history', label: 'ประวัติ', ic: '◷' },
  { to: '/me', label: 'ฉัน', ic: '☺' },
] as const;

export function BottomNav() {
  return (
    <nav className="bottomnav">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={'end' in it ? it.end : false} className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <span className="ic">{it.ic}</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
