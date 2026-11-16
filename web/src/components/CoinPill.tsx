import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSiteAsset } from '../context/SiteAssetsContext';

export function CoinPill({ to = '/wallet' }: { to?: string }) {
  const { user, gold } = useApp();
  const goldIcon = useSiteAsset('currency_gold');
  if (!user) {
    return (
      <Link to="/auth/login" className="coin-pill" style={{ opacity: 0.85 }}>
        <img src={goldIcon} alt="" width={16} height={16} className="coin-pill-img" />
        เข้าสู่ระบบ
      </Link>
    );
  }
  return (
    <Link to={to} className="coin-pill" title="Gold / เหรียญ">
      <img src={goldIcon} alt="" width={16} height={16} className="coin-pill-img" />
      {gold.toLocaleString('th-TH')}
    </Link>
  );
}
