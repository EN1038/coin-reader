import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ReaderHeader } from './ReaderHeader';

const HIDE = [/^\/read\//, /^\/auth\//, /^\/writer/, /^\/admin/];

export function AppShell() {
  const { pathname } = useLocation();
  const hide = HIDE.some((re) => re.test(pathname));
  return (
    <div className={hide ? 'app-shell' : 'app-shell has-nav'}>
      {!hide && <ReaderHeader />}
      <div className="content">
        <Outlet />
      </div>
      {!hide && <BottomNav />}
    </div>
  );
}
