import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { LedgerEntry, LedgerKind } from '../lib/types';
import { useApp } from '../context/AppContext';

const KIND: Record<LedgerKind, string> = {
  topup: 'เติม',
  unlock: 'ปลดล็อก',
  unlock_work: 'ซื้อทั้งเรื่อง',
  checkin: 'เช็คอิน',
  referral: 'แนะนำเพื่อน',
  tip: 'สนับสนุน',
};

export function WalletPage() {
  const { user, balance, tickets, isMock } = useApp();
  const nav = useNavigate();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/wallet'); return; }
    api.listLedger().then(setLedger).catch(() => setLedger([]));
  }, [user, nav, balance]);

  return (
    <div className="wallet-page">
      <div className="wallet-hero">
        <div className="muted">ยอดเหรียญ {isMock ? '· mock' : ''}</div>
        <div className="wallet-balance"><span className="coin-dot" />{balance.toLocaleString('th-TH')}</div>
        <div className="muted">ตั๋วอ่านฟรี {tickets} ใบ</div>
        <Link to="/wallet/topup" className="btn btn-coin" style={{ marginTop: 12 }}>เติมเหรียญ</Link>
      </div>
      <div className="notice">
        เหรียญคืนไม่ได้ ไม่โอนให้บัญชีอื่น ไม่แลกเป็นเงินสด และเหรียญที่เหลือจะหายไปเมื่อปิดบัญชี
        {' '}<Link to="/legal/coins">นโยบายเหรียญ</Link>
      </div>
      <div className="sec"><h2>ประวัติ</h2><span className="muted">อ่านอย่างเดียว · client ไม่เขียน ledger</span></div>
      {ledger.length === 0 && <p className="pad muted">ยังไม่มีรายการ</p>}
      <div className="ledger">
        {ledger.map((e) => (
          <div key={e.id} className="ledger-row">
            <div>
              <span className={`kind-tag ${e.kind}`}>{KIND[e.kind] ?? e.kind}</span>
              <div className="ledger-label">{e.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {new Date(e.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
              </div>
            </div>
            <strong className={e.amount > 0 ? 'plus' : e.amount < 0 ? 'minus' : ''}>
              {e.amount > 0 ? '+' : ''}{e.amount}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
