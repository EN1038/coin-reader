import { IconCoin } from './icons';

/** แสดงจำนวนเหรียญด้วย SVG แทน emoji */
export function CoinAmount({
  value,
  size = 14,
  className = '',
}: {
  value: number | string;
  size?: number;
  className?: string;
}) {
  const text = typeof value === 'number' ? value.toLocaleString('th-TH') : value;
  return (
    <span className={`coin-amount${className ? ` ${className}` : ''}`}>
      <IconCoin size={size} className="coin-amount-ic" />
      <span>{text}</span>
    </span>
  );
}
