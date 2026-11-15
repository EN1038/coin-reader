/** Reader / writer achievement tiers — mock economy (Stock Manga) */

export type ReaderTierId = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
export type WriterTierId = 'base' | 'plus' | 'pro' | 'elite';

export interface ReaderTier {
  id: ReaderTierId;
  label: string;
  /** cumulative top-up Gold (paid only, excludes check-in etc.) */
  minLifetime: number;
  /** bonus % of the lifetime top-up when first reaching this tier */
  bonusPercent: number;
}

export interface WriterTier {
  id: WriterTierId;
  label: string;
  /** lifetime sales Gold volume before fee */
  minSales: number;
  /** platform fee in basis points (1000 = 10%) */
  feeBps: number;
}

export const READER_TIERS: ReaderTier[] = [
  { id: 'none', label: 'ทั่วไป', minLifetime: 0, bonusPercent: 0 },
  { id: 'bronze', label: 'Bronze', minLifetime: 500, bonusPercent: 1 },
  { id: 'silver', label: 'Silver', minLifetime: 1000, bonusPercent: 1 },
  { id: 'gold', label: 'Gold', minLifetime: 3000, bonusPercent: 2 },
  { id: 'platinum', label: 'Platinum', minLifetime: 10000, bonusPercent: 3 },
];

export const WRITER_TIERS: WriterTier[] = [
  { id: 'base', label: 'Base', minSales: 0, feeBps: 1000 },
  { id: 'plus', label: 'Plus', minSales: 2000, feeBps: 800 },
  { id: 'pro', label: 'Pro', minSales: 10000, feeBps: 600 },
  { id: 'elite', label: 'Elite', minSales: 50000, feeBps: 500 },
];

export function readerTierForLifetime(lifetime: number): ReaderTier {
  let current = READER_TIERS[0];
  for (const t of READER_TIERS) {
    if (lifetime >= t.minLifetime) current = t;
  }
  return current;
}

export function writerTierForSales(lifetimeSales: number): WriterTier {
  let current = WRITER_TIERS[0];
  for (const t of WRITER_TIERS) {
    if (lifetimeSales >= t.minSales) current = t;
  }
  return current;
}

/** Must earn >= 25% of current tier's minSales within the month or drop one tier */
export function evaluateWriterTierDrop(
  currentId: WriterTierId,
  monthSales: number,
): WriterTierId {
  const idx = WRITER_TIERS.findIndex((t) => t.id === currentId);
  if (idx <= 0) return 'base';
  const current = WRITER_TIERS[idx];
  const need = Math.ceil(current.minSales * 0.25);
  if (monthSales >= need) return currentId;
  return WRITER_TIERS[idx - 1].id;
}

export function feeBpsForWriterTier(id: WriterTierId): number {
  return WRITER_TIERS.find((t) => t.id === id)?.feeBps ?? 1000;
}

export function monthKeyBangkok(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}-${m}`;
}
