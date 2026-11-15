import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ReaderHeader } from './ReaderHeader';

/** Hide main chrome entirely (reader / auth / desks). */
const HIDE_CHROME = [/^\/read\//, /^\/auth\//, /^\/writer/, /^\/admin/];

/** Pages that render their own Topbar — avoid stacking with ReaderHeader. */
const PAGE_TOPBAR = [
  /^\/auth\//,
  /^\/legal\//,
  /^\/help/,
  /^\/me\/settings/,
  /^\/wallet$/,
  /^\/wallet\/pay\//,
];

export function AppShell() {
  const { pathname } = useLocation();
  const hideChrome = HIDE_CHROME.some((re) => re.test(pathname));
  const hideMainHeader = hideChrome || PAGE_TOPBAR.some((re) => re.test(pathname));
  const showBottomNav = !hideChrome;

  return (
    <div className={showBottomNav ? 'app-shell has-nav' : 'app-shell'}>
      {!hideMainHeader && <ReaderHeader />}
      <div className="content">
        <Outlet />
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
