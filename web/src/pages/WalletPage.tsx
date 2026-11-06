import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { LedgerEntry } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { useApp } from '../context/AppContext';

export function WalletPage() {
  const { user, balance, isMock } = useApp();
  const nav = useNavigate();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/wallet'); return; }
    api.listLedger().then(setLedger).catch(() => setLedger([]));
  }, [user, nav, balance]);

  return (
    <>
      <Topbar title="กระเป๋าเหรียญ" back="/me" />
      <div className="form-narrow">
      <div className="px-4 py-2"><MockBanner>รายการด้านล่างเป็นการอ่าน ledger อย่างเดียว · client ไม่เขียน coin_ledger</MockBanner></div>
      <div style={{ margin: '8px 16px', padding: 16, borderRadius: 16, background: 'linear-gradient(145deg,var(--hero-start),var(--hero-end))', color: 'var(--on-hero)' }}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>ยอดคงเหลือ</div>
        <div style={{ fontSize: 36, fontFamily: 'var(--font-head)', fontWeight: 700, margin: '6px 0' }}>🪙 {balance}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{isMock ? 'ข้อมูลตัวอย่างในเครื่อง' : 'จาก my_wallet()'}</div>
        <Link to="/wallet/topup" className="btn btn-coin btn-sm" style={{ marginTop: 12 }}>เติมเหรียญ</Link>
      </div>
      <div className="px-4 mb-3">
        <div className="card" style={{ background: 'var(--note-bg)', borderColor: 'color-mix(in srgb, var(--accent-coin) 45%, var(--line))', fontSize: 12, color: 'var(--note)' }}>
          เหรียญคืนไม่ได้ · ไม่แลกเป็นเงินสด · ไม่โอนให้ผู้อื่น — <Link to="/legal/coins"><u>นโยบายเหรียญ</u></Link>
        </div>
      </div>
      <div className="sec"><h2>ประวัติธุรกรรม</h2><span className="ex">อ่านอย่างเดียว</span></div>
      {ledger.length === 0 && <p className="center muted p-4">ยังไม่มีรายการ</p>}
      {ledger.map((e) => (
        <div key={e.id} className="row-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14 }}>{e.label}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              {new Date(e.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: e.amount >= 0 ? 'var(--ok)' : 'var(--text)' }}>
            {e.amount >= 0 ? '+' : ''}{e.amount}
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
