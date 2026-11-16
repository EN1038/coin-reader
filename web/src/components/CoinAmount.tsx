import type { CoinCurrency } from '../lib/types';
import { useSiteAsset } from '../context/SiteAssetsContext';

/** แสดงจำนวน Gold / Diamond ด้วยรูปแบรนด์ */
export function CoinAmount({
  value,
  size = 14,
  className = '',
  currency = 'gold',
}: {
  value: number | string;
  size?: number;
  className?: string;
  currency?: CoinCurrency;
}) {
  const gold = useSiteAsset('currency_gold');
  const diamond = useSiteAsset('currency_diamond');
  const text = typeof value === 'number' ? value.toLocaleString('th-TH') : value;
  const src = currency === 'diamond' ? diamond : gold;
  const alt = currency === 'diamond' ? 'เพชร' : 'เหรียญ';
  return (
    <span className={`coin-amount coin-${currency}${className ? ` ${className}` : ''}`}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="coin-amount-ic coin-amount-img"
        decoding="async"
      />
      <span>{text}</span>
    </span>
  );
}
