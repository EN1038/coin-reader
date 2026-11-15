import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { LedgerEntry, LedgerKind } from '../lib/types';
import { useApp } from '../context/AppContext';
import { CoinAmount } from '../components/CoinAmount';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

const KIND: Record<LedgerKind, string> = {
  topup: 'เติม Gold',
  topup_bonus: 'โบนัสระดับ',
  unlock: 'ปลดล็อก',
  unlock_work: 'ซื้อทั้งเรื่อง',
  checkin: 'เช็คอิน',
  referral: 'แนะนำเพื่อน',
  tip: 'สนับสนุน',
  diamond_earn: 'ได้ Diamond',
  diamond_payout: 'ถอน Diamond',
  diamond_to_gold: 'แลก Diamond↔Gold',
};

export function WalletPage() {
  const { user, gold, diamond, tickets, isMock, refresh } = useApp();
  const nav = useNavigate();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [readerTier, setReaderTier] = useState(() =>
    user && isMockMode ? mockDb.readerAchievement(user.id) : null,
  );
  const [convertAmt, setConvertAmt] = useState(10);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/wallet'); return; }
    api.listLedger().then(setLedger).catch(() => setLedger([]));
    if (isMockMode) setReaderTier(mockDb.readerAchievement(user.id));
  }, [user, nav, gold, diamond]);

  function onConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isMockMode) return;
    setMsg('');
    try {
      mockDb.convertDiamondToGold(user.id, convertAmt);
      refresh();
      setMsg(`แลก ${convertAmt} Diamond → Gold สำเร็จ`);
    } catch {
      setMsg('แลกไม่สำเร็จ — Diamond ไม่พอ');
    }
  }

  return (
    <div className="wallet-page">
      <div className="wallet-hero">
        <div className="muted">กระเป๋า Stock Manga {isMock ? '· mock' : ''}</div>
        <div className="wallet-balance-row">
          <div>
            <div className="muted" style={{ fontSize: 12 }}>Gold (นักอ่าน)</div>
            <div className="wallet-balance"><CoinAmount value={gold} size={20} currency="gold" className="head-amt" /></div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 12 }}>Diamond (นักแปล)</div>
            <div className="wallet-balance"><CoinAmount value={diamond} size={20} currency="diamond" className="head-amt" /></div>
          </div>
        </div>
        <div className="muted">ตั๋วอ่านฟรี {tickets} ใบ</div>
        {readerTier && (
          <div className={`tier-badge tier-${readerTier.tier_id}`} title="ระดับนักอ่านจากยอดเติมสะสม">
            <span className="tier-badge-bob" aria-hidden />
            {readerTier.tier_label}
            <small>เติมสะสม {readerTier.lifetime_topup.toLocaleString()} G
              {readerTier.next_tier_at != null ? ` · ถัดไป ${readerTier.next_tier_at.toLocaleString()}` : ''}
            </small>
          </div>
        )}
        <Link to="/wallet/topup" className="btn btn-coin" style={{ marginTop: 12 }}>เติม Gold</Link>
      </div>

      <div className="notice">
        Gold คืนเป็นเงินสดไม่ได้ · Diamond ถอนธนาคารได้เมื่อเป็นนักแปล (ขั้นต่ำ 500) หรือแลกเป็น Gold 1:1
        {' '}<Link to="/legal/coins">นโยบายเหรียญ</Link>
      </div>

      {isMock && diamond > 0 && (
        <form className="card" style={{ margin: '0 16px 12px', padding: 14 }} onSubmit={onConvert}>
          <strong style={{ display: 'block', marginBottom: 8 }}>แลก Diamond → Gold (1:1)</strong>
          <div className="row" style={{ gap: 8 }}>
            <input
              type="number"
              min={1}
              max={diamond}
              value={convertAmt}
              onChange={(e) => setConvertAmt(Number(e.target.value))}
              style={{ flex: 1, minHeight: 40, borderRadius: 10, border: '1px solid var(--line)', padding: '0 12px' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">แลก</button>
          </div>
          {msg && <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ok)' }}>{msg}</p>}
        </form>
      )}

      <div className="sec"><h2>ประวัติ</h2><span className="muted">อ่านอย่างเดียว</span></div>
      {ledger.length === 0 && <p className="pad muted">ยังไม่มีรายการ</p>}
      <div className="ledger">
        {ledger.map((e) => (
          <div key={e.id} className="ledger-row">
            <div>
              <span className={`kind-tag ${e.kind}`}>{KIND[e.kind] ?? e.kind}</span>
              <div className="ledger-label">{e.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {new Date(e.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
                {e.currency ? ` · ${e.currency === 'diamond' ? 'Diamond' : 'Gold'}` : ''}
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
