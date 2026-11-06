import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function CoinPill({ to = '/wallet' }: { to?: string }) {
  const { user, balance } = useApp();
  if (!user) {
    return (
      <Link to="/auth/login" className="coin-pill" style={{ opacity: 0.85 }}>
        <span className="dot" /> เข้าสู่ระบบ
      </Link>
    );
  }
  return (
    <Link to={to} className="coin-pill">
      <span className="dot" />
      {balance.toLocaleString('th-TH')}
    </Link>
  );
}
