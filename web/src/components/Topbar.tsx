import { useNavigate } from 'react-router-dom';
import { CoinPill } from './CoinPill';
import { IconBack } from './icons';

export function Topbar({
  title, back, right, showCoin = true, transparent,
}: {
  title?: React.ReactNode;
  back?: boolean | string;
  right?: React.ReactNode;
  showCoin?: boolean;
  transparent?: boolean;
}) {
  const nav = useNavigate();
  const showBack = back !== undefined && back !== false;

  return (
    <header className={transparent ? 'topbar topbar-transparent' : 'topbar'}>
      <div className="topbar-inner">
        {showBack && (
          <button
            type="button"
            className="icon-btn topbar-back"
            aria-label="ย้อนกลับ"
            onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          >
            <IconBack />
          </button>
        )}
        <div className="title">{title}</div>
        <div className="topbar-right">
          {right}
          {showCoin && !right && <CoinPill />}
        </div>
      </div>
    </header>
  );
}
