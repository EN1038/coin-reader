import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CURRENCY_GOLD } from '../lib/brand';

export function CoinPill({ to = '/wallet' }: { to?: string }) {
  const { user, gold } = useApp();
  if (!user) {
    return (
      <Link to="/auth/login" className="coin-pill" style={{ opacity: 0.85 }}>
        <img src={CURRENCY_GOLD} alt="" width={16} height={16} className="coin-pill-img" />
        เข้าสู่ระบบ
      </Link>
    );
  }
  return (
    <Link to={to} className="coin-pill" title="Gold / เหรียญ">
      <img src={CURRENCY_GOLD} alt="" width={16} height={16} className="coin-pill-img" />
      {gold.toLocaleString('th-TH')}
    </Link>
  );
}
