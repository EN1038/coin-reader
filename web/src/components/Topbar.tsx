import { useNavigate } from 'react-router-dom';
import { CoinPill } from './CoinPill';

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
  return (
    <div className="topbar" style={transparent ? { background: 'transparent', border: 0 } : undefined}>
      {back !== undefined && back !== false && (
        <button
          type="button"
          className="icon-btn"
          aria-label="ย้อนกลับ"
          onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
        >
          ←
        </button>
      )}
      <div className="title">{title}</div>
      {right}
      {showCoin && !right && <CoinPill />}
    </div>
  );
}
