import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, newIdempotencyKey } from '../lib/supabase';
import type { CoinPack } from '../lib/types';
import { MockBanner } from '../components/MockBanner';
import { useApp, errMessage } from '../context/AppContext';

function fakeQr(seed: string): string {
  const cells = 21;
  const bits: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < cells * cells; i += 1) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const edge = i < cells || i >= cells * (cells - 1) || i % cells === 0 || i % cells === cells - 1;
    const finder = (i % cells < 6 && Math.floor(i / cells) < 6)
      || (i % cells > cells - 7 && Math.floor(i / cells) < 6)
      || (i % cells < 6 && Math.floor(i / cells) > cells - 7);
    bits.push(edge || finder || h % 3 === 0);
  }
  const rects = bits.map((on, i) => {
    if (!on) return '';
    const x = i % cells;
    const y = Math.floor(i / cells);
    return `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cells} ${cells}" shape-rendering="crispEdges"><rect width="${cells}" height="${cells}" fill="#fff"/>${rects.replaceAll('<rect', '<rect fill="#101827"')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function TopupPage() {
  const { user, balance, setBalance, isMock } = useApp();
  const nav = useNavigate();
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [selected, setSelected] = useState('');
  const [slipName, setSlipName] = useState('');
  const [slipUrl, setSlipUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ref] = useState(() => `TB${Date.now().toString().slice(-8)}`);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/wallet/topup'); return; }
    api.listPacks().then((list) => {
      setPacks(list);
      setSelected(list.find((p) => p.coins === 300)?.id ?? list[0]?.id ?? '');
    }).catch(() => setPacks([]));
  }, [user, nav]);

  const pack = packs.find((p) => p.id === selected);
  const qr = useMemo(() => (pack ? fakeQr(`${ref}-${pack.amount_thb}`) : ''), [pack, ref]);

  function onSlip(file: File | undefined) {
    setSlipName(file?.name ?? '');
    if (slipUrl) URL.revokeObjectURL(slipUrl);
    setSlipUrl(file ? URL.createObjectURL(file) : '');
  }

  async function pay() {
    if (!pack) return;
    if (!slipName) {
      setError('อัปโหลดสลิปจำลองก่อนยืนยัน');
      return;
    }
    setBusy(true);
    setError('');
    nav('/wallet/pay/pending');
    try {
      await new Promise((r) => setTimeout(r, 500));
      const result = await api.mockTopup(pack.id, newIdempotencyKey());
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
    <div className="topup-page">
      <div className="page-head">
        <h1>เติมเหรียญ</h1>
        <p className="muted">ยอดตอนนี้ {balance.toLocaleString('th-TH')} · {isMock ? 'ไม่มีการเรียกเก็บเงินจริง' : ''}</p>
      </div>
      <div className="pad"><MockBanner>PromptPay และสลิปเป็นการจำลองในเบราว์เซอร์ ไฟล์ไม่ถูกส่งออกไปไหน</MockBanner></div>
      <div className="pack-grid">
        {packs.map((pk) => (
          <button key={pk.id} type="button" className={`pack${selected === pk.id ? ' on' : ''}`} onClick={() => setSelected(pk.id)}>
            <div className="amt">🪙 {pk.coins.toLocaleString('th-TH')}</div>
            {pk.bonus_coins > 0 && <div className="bonus">+โบนัส {pk.bonus_coins}</div>}
            <div className="baht">{pk.amount_thb.toLocaleString('th-TH')} บาท</div>
          </button>
        ))}
      </div>
      <p className="fine-print">อัตราบาทต่อเหรียญและโบนัสเป็นตัวเลขตัวอย่างสำหรับเดโม ยังไม่ใช่ราคาผลิตภัณฑ์</p>

      {pack && (
        <section className="qr-card">
          <h2>QR PromptPay จำลอง</h2>
          <img src={qr} alt="คิวอาร์โค้ดจำลอง ไม่ใช่พร้อมเพย์จริง" width={180} height={180} />
          <p>จำนวน <strong>{pack.amount_thb.toLocaleString('th-TH')} บาท</strong></p>
          <p className="muted">รหัสอ้างอิง {ref}</p>
          <p>ได้ {pack.coins} เหรียญ{pack.bonus_coins ? ` + โบนัส ${pack.bonus_coins}` : ''} · โบนัสไม่ถูกนับใน 7% ของการชวนเพื่อน</p>
          <label className="slip-drop">
            <span>{slipName ? `สลิป: ${slipName}` : 'อัปโหลดสลิป (ไฟล์รูปจำลอง)'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onSlip(e.target.files?.[0])}
            />
          </label>
          {slipUrl && <img className="slip-preview" src={slipUrl} alt="ตัวอย่างสลิปที่เลือก" />}
        </section>
      )}

      <div className="notice">
        เหรียญที่เติมแล้วคืนไม่ได้ ไม่โอน และหายเมื่อปิดบัญชี · <Link to="/legal/coins">อ่านนโยบาย</Link>
      </div>
      {error && <p className="form-error pad">{error}</p>}
      <div className="pay-bar">
        <button type="button" className="btn btn-coin btn-block" disabled={!pack || busy} onClick={pay}>
          {pack ? `ยืนยันการโอนจำลอง ${pack.amount_thb} บาท` : 'เลือกแพ็ก'}
        </button>
      </div>
    </div>
  );
}
