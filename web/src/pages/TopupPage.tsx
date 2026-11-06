import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, newIdempotencyKey } from '../lib/supabase';
import type { CoinPack } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { Badge } from '../components/Badge';
import { useApp, errMessage } from '../context/AppContext';

export function TopupPage() {
  const { user, balance, setBalance, isMock } = useApp();
  const nav = useNavigate();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'pp' | 'card'>('pp');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/wallet/topup'); return; }
    api.listPacks().then((list) => {
      setPacks(list);
      setSelected(list.find((p) => p.coins === 100)?.id ?? list[0]?.id ?? '');
    });
  }, [user, nav]);

  const pack = packs.find((p) => p.id === selected);

  async function pay() {
    if (!pack) return;
    setBusy(true);
    setError('');
    nav('/wallet/pay/pending');
    try {
      // brief pending UX
      await new Promise((r) => setTimeout(r, 600));
      const key = newIdempotencyKey();
      const result = await api.mockTopup(pack.id, key);
      setBalance(result.balance);
      nav('/wallet/pay/success', { state: { coins: result.coins_added, balance: result.balance, replayed: result.replayed } });
    } catch (e) {
      setError(errMessage(e));
      nav('/wallet/pay/fail', { state: { message: errMessage(e) } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar title="เติมเหรียญ" back />
      <div className="px-4 py-2"><MockBanner /></div>
      <div style={{ margin: '12px 16px', padding: 14, borderRadius: 16, background: 'linear-gradient(145deg,#1C1828,#3D2E6B)', color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>ยอดคงเหลือ {isMock ? '(ตัวอย่าง)' : ''}</div>
        <div style={{ fontSize: 32, fontFamily: 'var(--font-head)', fontWeight: 700, margin: '6px 0' }}>🪙 {balance}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>1 เหรียญ ≈ 1 บาท (มาตรฐานตลาด · ยังไม่ล็อกราคาผลิตภัณฑ์)</div>
      </div>

      <div className="sec" style={{ paddingTop: 8, paddingBottom: 4 }}>
        <h2>เลือกแพ็ก</h2>
        <span className="ex">ราคาตัวอย่างจาก seed</span>
      </div>
      <div className="stack px-4">
        {packs.map((pk) => (
          <button
            key={pk.id}
            type="button"
            className={`pack${selected === pk.id ? ' on' : ''}`}
            onClick={() => setSelected(pk.id)}
          >
            <div>
              <div className="amt">🪙 {pk.coins}</div>
              <div className="baht">{pk.amount_thb} บาท</div>
            </div>
            <Badge kind={pk.coins === 100 ? 'note' : undefined}>
              {pk.coins === 50 ? 'แพ็กเล็ก' : pk.coins === 100 ? 'แนะนำ' : 'แพ็กกลาง'}
            </Badge>
          </button>
        ))}
      </div>

      <div className="sec" style={{ paddingTop: 8, paddingBottom: 4 }}><h2>ช่องทางชำระ (mock)</h2></div>
      <div className="stack px-4">
        {([
          ['pp', 'PromptPay QR', 'จำลองเท่านั้น · ไม่สร้าง QR จริง'],
          ['card', 'บัตรเครดิต/เดบิต', 'จำลองเท่านั้น'],
        ] as const).map(([id, title, sub]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPayMethod(id)}
            className="row"
            style={{
              padding: 14, borderRadius: 14, border: `1.5px solid ${payMethod === id ? 'var(--primary)' : 'var(--line)'}`,
              background: payMethod === id ? 'var(--c-violet-50)' : 'var(--surface)', width: '100%', textAlign: 'left',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: '50%', border: `2px solid ${payMethod === id ? 'var(--primary)' : 'var(--line)'}`,
              background: payMethod === id ? 'var(--primary)' : 'transparent',
              boxShadow: payMethod === id ? 'inset 0 0 0 3px #fff' : undefined,
            }} />
            <div style={{ flex: 1 }}>
              <b style={{ fontFamily: 'var(--font-head)' }}>{title}</b>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 mb-4">
        <div className="card" style={{ background: 'var(--note-bg)', borderColor: '#F0E0B0', fontSize: 12, color: 'var(--note)', lineHeight: 1.55 }}>
          <strong>เหรียญคืนไม่ได้</strong> — เมื่อเติมแล้วไม่สามารถแลกคืนเป็นเงินสดหรือโอนให้ผู้อื่นได้ ดู{' '}
          <Link to="/legal/coins"><u>นโยบายเหรียญ</u></Link>
        </div>
      </div>

      {error && <p className="center" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: 'var(--surface)', position: 'sticky', bottom: 0 }}>
        <button type="button" className="btn btn-coin btn-block" disabled={!pack || busy} onClick={pay}>
          {pack ? `จำลองชำระ ${pack.amount_thb} บาท → ได้ ${pack.coins} เหรียญ` : 'เลือกแพ็ก'}
        </button>
      </div>
    </>
  );
}
