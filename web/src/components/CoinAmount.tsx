import type { CoinCurrency } from '../lib/types';
import { CURRENCY_DIAMOND, CURRENCY_GOLD } from '../lib/brand';

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
  const text = typeof value === 'number' ? value.toLocaleString('th-TH') : value;
  const src = currency === 'diamond' ? CURRENCY_DIAMOND : CURRENCY_GOLD;
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
