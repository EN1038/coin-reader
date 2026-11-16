/** Calendar day in Asia/Bangkok as YYYY-MM-DD. */
export function bangkokToday(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function bangkokParts(isoDay: string): { y: number; m: number; d: number } {
  const [y, m, d] = isoDay.split('-').map(Number);
  return { y, m, d };
}

export function daysInMonth(isoDay: string): number {
  const { y, m } = bangkokParts(isoDay);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoDay(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Coins and tickets for one calendar day. Last day replaces the daily coin grant. */
export function checkInReward(isoDay: string, today: string): { coins: number; tickets: number; monthEnd: boolean } {
  const { d } = bangkokParts(isoDay);
  const dim = daysInMonth(today);
  const monthEnd = d === dim;
  const coins = monthEnd ? 30 : 2;
  const tickets = (d % 7 === 0 ? 1 : 0) + (monthEnd ? 3 : 0);
  return { coins, tickets, monthEnd };
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString('th-TH');
}

export function relativeTime(iso: string, now = Date.now()): string {
  const delta = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(delta / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short' });
}

export function kindLabel(kind: 'novel' | 'manga'): string {
  return kind === 'manga' ? 'มังงะ' : 'นิยาย';
}

export function statusLabel(status: 'published' | 'completed'): string {
  return status === 'completed' ? 'จบ' : 'กำลังดำเนินเรื่อง';
}
