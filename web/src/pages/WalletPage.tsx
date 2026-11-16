import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isMockMode } from '../lib/supabase';
import type { LedgerEntry, LedgerKind } from '../lib/types';
import { useApp } from '../context/AppContext';
import { CoinAmount } from '../components/CoinAmount';
import { Topbar } from '../components/Topbar';
import { useSiteAsset } from '../context/SiteAssetsContext';
import { mockDb } from '../lib/mock/store';
import { profilePathFor } from '../lib/profileSlug';
import { IconChevronRight, IconTicket } from '../components/icons';

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

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WalletPage() {
  const { user, gold, diamond, tickets, isMock, refresh } = useApp();
  const goldIcon = useSiteAsset('currency_gold');
  const diamondIcon = useSiteAsset('currency_diamond');
  const nav = useNavigate();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [readerTier, setReaderTier] = useState(() =>
    user && isMockMode ? mockDb.readerAchievement(user.id) : null,
  );
  const [convertAmt, setConvertAmt] = useState(10);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      nav('/auth/login?next=/wallet');
      return;
    }
    api.listLedger().then(setLedger).catch(() => setLedger([]));
    if (isMockMode) setReaderTier(mockDb.readerAchievement(user.id));
  }, [user, nav, gold, diamond]);

  if (!user) return null;

  const backTo = profilePathFor(user);

  function onConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isMockMode) return;
    setMsg('');
    setError('');
    try {
      mockDb.convertDiamondToGold(user.id, convertAmt);
      void refresh();
      setMsg(`แลก ${convertAmt} Diamond เป็น Gold แล้ว`);
    } catch {
      setError('แลกไม่สำเร็จ — Diamond ไม่พอ');
    }
  }

  return (
    <>
      <Topbar title="กระเป๋าเหรียญ" back={backTo} showCoin={false} />

      <div className="wallet-page">
        <div className="wallet-frame">
          <section className="wallet-balances" aria-label="ยอดคงเหลือ">
            <div className="wallet-bal-card wallet-bal-gold">
              <div className="wallet-bal-head">
                <span className="wallet-bal-ic" aria-hidden>
                  <img src={goldIcon} alt="" width={28} height={28} decoding="async" />
                </span>
                <div>
                  <strong>Gold</strong>
                  <span>ใช้ปลดล็อกตอน</span>
                </div>
              </div>
              <div className="wallet-bal-value">
                <CoinAmount value={gold} size={28} currency="gold" />
              </div>
              <Link to="/wallet/topup" className="btn btn-ghost btn-block">
                เติม Gold <IconChevronRight size={16} />
              </Link>
            </div>

            <div className="wallet-bal-card wallet-bal-diamond">
              <div className="wallet-bal-head">
                <span className="wallet-bal-ic" aria-hidden>
                  <img src={diamondIcon} alt="" width={28} height={28} decoding="async" />
                </span>
                <div>
                  <strong>Diamond</strong>
                  <span>รายได้นักแปล</span>
                </div>
              </div>
              <div className="wallet-bal-value">
                <CoinAmount value={diamond} size={28} currency="diamond" />
              </div>
              <Link to="/writer/payout" className="btn btn-ghost btn-block">
                ถอน / จัดการ <IconChevronRight size={16} />
              </Link>
            </div>
          </section>

          <div className="wallet-meta-row">
            <div className="wallet-meta-chip">
              <IconTicket size={16} />
              <span>ตั๋วอ่านฟรี <strong>{tickets}</strong></span>
            </div>
            {readerTier && (
              <div className={`wallet-meta-chip tier-badge tier-${readerTier.tier_id}`}>
                <span className="tier-badge-bob" aria-hidden />
                <span>
                  {readerTier.tier_label}
                  <small>
                    เติมสะสม {readerTier.lifetime_topup.toLocaleString()} G
                    {readerTier.next_tier_at != null ? ` · ถัดไป ${readerTier.next_tier_at.toLocaleString()}` : ''}
                  </small>
                </span>
              </div>
            )}
            {isMock && <span className="wallet-mock-tag">mock</span>}
          </div>

          <p className="wallet-notice">
            Gold คืนเป็นเงินสดไม่ได้ · Diamond ถอนได้เมื่อเป็นนักแปล (ขั้นต่ำ 500) หรือแลกเป็น Gold 1:1
            {' '}<Link to="/legal/coins">นโยบายเหรียญ</Link>
          </p>

          {isMock && diamond > 0 && (
            <form className="wallet-convert card" onSubmit={onConvert}>
              <div className="wallet-convert-head">
                <strong>แลก Diamond เป็น Gold</strong>
                <span>อัตรา 1:1 · โหมดตัวอย่าง</span>
              </div>
              <div className="wallet-convert-row">
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="wallet-convert-amt">จำนวน Diamond</label>
                  <input
                    id="wallet-convert-amt"
                    type="number"
                    min={1}
                    max={diamond}
                    value={convertAmt}
                    onChange={(e) => setConvertAmt(Number(e.target.value))}
                  />
                </div>
                <button type="submit" className="btn btn-primary">แลก</button>
              </div>
              {msg && <p className="wallet-convert-msg ok">{msg}</p>}
              {error && <p className="wallet-convert-msg err">{error}</p>}
            </form>
          )}

          <section className="wallet-ledger-sec">
            <div className="wallet-ledger-head">
              <h2>ประวัติธุรกรรม</h2>
              <span className="muted">อ่านอย่างเดียว</span>
            </div>

            {ledger.length === 0 ? (
              <div className="wallet-empty">
                <p>ยังไม่มีรายการ</p>
                <Link to="/wallet/topup" className="btn btn-primary btn-sm">เติม Gold ครั้งแรก</Link>
              </div>
            ) : (
              <div className="wallet-ledger">
                {ledger.map((e) => {
                  const currency = e.currency === 'diamond' ? 'diamond' : 'gold';
                  const abs = Math.abs(e.amount);
                  return (
                    <div key={e.id} className="wallet-ledger-row">
                      <div className="wallet-ledger-copy">
                        <span className={`kind-tag ${e.kind}`}>{KIND[e.kind] ?? e.kind}</span>
                        <strong className="wallet-ledger-label">{e.label}</strong>
                        <time dateTime={e.created_at}>{formatWhen(e.created_at)}</time>
                      </div>
                      <div className={`wallet-ledger-amt ${e.amount > 0 ? 'plus' : e.amount < 0 ? 'minus' : ''}`}>
                        <span className="wallet-ledger-sign">{e.amount > 0 ? '+' : e.amount < 0 ? '−' : ''}</span>
                        <CoinAmount value={abs} size={16} currency={currency} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
