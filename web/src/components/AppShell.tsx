import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

const HIDE_NAV = [/^\/read\//, /^\/auth\//, /^\/wallet\/pay/, /^\/legal\//, /^\/writer/, /^\/admin/];

export function AppShell() {
  const { pathname } = useLocation();
  const hide = HIDE_NAV.some((re) => re.test(pathname));
  return (
    <div className="app-shell">
      <div className="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Outlet />
      </div>
      {!hide && <BottomNav />}
    </div>
  );
}
