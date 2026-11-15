import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { IconCoin } from './icons';

export function CoinPill({ to = '/wallet' }: { to?: string }) {
  const { user, balance } = useApp();
  if (!user) {
    return (
      <Link to="/auth/login" className="coin-pill" style={{ opacity: 0.85 }}>
        <IconCoin size={14} /> เข้าสู่ระบบ
      </Link>
    );
  }
  return (
    <Link to={to} className="coin-pill">
      <IconCoin size={14} />
      {balance.toLocaleString('th-TH')}
    </Link>
  );
}
