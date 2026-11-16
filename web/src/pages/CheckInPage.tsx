import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { CheckInCalendar } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';
import { bangkokParts, checkInReward } from '../lib/format';

const WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export function CheckInPage() {
  const { user, setBalance, setTickets } = useApp();
  const nav = useNavigate();
  const [cal, setCal] = useState<CheckInCalendar | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/check-in'); return; }
    api.checkInCalendar().then(setCal).catch((e) => setError(errMessage(e)));
  }, [user, nav]);

  async function claim() {
    setBusy(true);
    setError('');
    try {
      const r = await api.claimCheckIn();
      setBalance(r.balance);
      setTickets(r.ticket_balance);
      setCal(await api.checkInCalendar());
      setMsg(r.already
        ? 'วันนี้รับไปแล้ว'
        : r.month_end
          ? `รางวัลท้ายเดือน +${r.coins} เหรียญ และ ${r.tickets} ตั๋ว`
          : `รับ +${r.coins} เหรียญ${r.tickets ? ` และ ${r.tickets} ตั๋วอ่านฟรี` : ''}`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!cal) return <div className="pad muted">{error || 'กำลังโหลด…'}</div>;
  const { y, m } = bangkokParts(cal.today);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const cells: Array<number | null> = [...Array(mondayIndex).fill(null), ...Array.from({ length: cal.days_in_month }, (_, i) => i + 1)];

  return (
    <div className="checkin-page">
      <div className="page-head">
        <h1>เช็คอินรายวัน</h1>
        <p className="muted">กดรับได้วันละครั้ง · เหรียญและตั๋วเป็น mock คืนไม่ได้และโอนไม่ได้</p>
      </div>
      <div className="checkin-summary">
        <div><span>ตั๋วอ่านฟรี</span><strong>{cal.tickets}</strong></div>
        <div><span>เหรียญรายวัน</span><strong>+{cal.daily_coins}</strong></div>
        <div><span>ท้ายเดือน</span><strong>+{cal.month_end_coins} / {cal.month_end_tickets} ตั๋ว</strong></div>
      </div>
      <div className="cal-grid" aria-label={`ปฏิทิน ${cal.month}`}>
        {WEEKDAYS.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = `${cal.month}-${String(day).padStart(2, '0')}`;
          const claimed = cal.claimed.includes(iso);
          const today = iso === cal.today;
          const reward = checkInReward(iso, cal.today);
          return (
            <div key={iso} className={`cal-day${claimed ? ' claimed' : ''}${today ? ' today' : ''}${reward.monthEnd ? ' finale' : ''}`}>
              <span>{day}</span>
              {reward.monthEnd && <small>รางวัลใหญ่</small>}
              {claimed && <small>รับแล้ว</small>}
              {!claimed && reward.tickets > 0 && !reward.monthEnd && <small>+ตั๋ว</small>}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-coin btn-block" disabled={busy || cal.claimed_today} onClick={claim}>
        {cal.claimed_today ? 'รับวันนี้แล้ว' : busy ? 'กำลังรับ…' : 'รับของวันนี้'}
      </button>
      {msg && <p className="ok-note">{msg}</p>}
      {error && <p className="form-error">{error}</p>}
      <ul className="fine-print">
        <li>ทุกวันที่ 7, 14, 21 และ 28 ได้ตั๋วอ่านฟรีเพิ่ม 1 ใบ ตั๋วใช้ปลดหนึ่งตอนที่ล็อก</li>
        <li>วันสุดท้ายของเดือนได้ 30 เหรียญและตั๋ว 3 ใบ แทนเหรียญรายวัน</li>
        <li>ตั๋วและเหรียญจากเช็คอินไม่แลกเป็นเงิน</li>
      </ul>
      <p className="pad"><Link to="/wallet">ดูกระเป๋าเหรียญ</Link></p>
    </div>
  );
}
