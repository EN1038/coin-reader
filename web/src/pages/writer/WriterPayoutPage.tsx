import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { CoinAmount } from '../../components/CoinAmount';
import { useApp } from '../../context/AppContext';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterPayoutPage() {
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const { refresh, diamond } = useApp();
  const gate = requireApprovedAuthor(author);
  const [amount, setAmount] = useState(500);
  const [convertAmt, setConvertAmt] = useState(50);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const dash = author ? mockDb.writerDashboard(author.id) : null;
  const ach = author ? mockDb.writerAchievement(author.user_id) : null;
  const list = useMemo(() => (author ? mockDb.listPayouts(author.id) : []), [author, tick]);
  const feePct = ach ? (ach.fee_bps / 100).toFixed(0) : '10';
  if (gate) return gate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      mockDb.requestPayout(author!.id, amount, mockDb.BANK_DOC_FIXTURE);
      setMsg('ส่งคำขอถอน Diamond แล้ว (mock · สถานะ pending)');
      setTick((n) => n + 1);
      refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BELOW_MINIMUM') setError(`ขั้นต่ำถอน ${mockDb.WRITER_POLICY.minimum_payout} Diamond`);
      else if (code === 'INSUFFICIENT_AVAILABLE' || code === 'INSUFFICIENT_DIAMOND') setError('Diamond / AVAILABLE ไม่พอ');
      else setError('ขอถอนไม่สำเร็จ');
    }
  }

  function onConvert(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      mockDb.convertDiamondToGold(author!.user_id, convertAmt);
      setMsg(`แลก ${convertAmt} Diamond → Gold สำเร็จ`);
      setTick((n) => n + 1);
      refresh();
    } catch {
      setError('แลกไม่สำเร็จ — Diamond ไม่พอ');
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>รายได้ Diamond / ขอถอน</h1>
      {ach && (
        <div className={`tier-badge tier-writer tier-${ach.tier_id}`} style={{ marginBottom: 12 }}>
          <span className="tier-badge-bob" aria-hidden />
          ระดับ {ach.tier_label} · ค่าคอม {feePct}%
          <small>
            ยอดขายสะสม {ach.lifetime_sales.toLocaleString()} · เดือนนี้ {ach.month_sales.toLocaleString()}
            {ach.maintain_need > 0 ? ` · รักษาระดับ ≥ ${ach.maintain_need.toLocaleString()}/เดือน` : ''}
          </small>
        </div>
      )}
      <div className="card mb-3" style={{ maxWidth: 720 }}>
        <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          1 Gold จากผู้อ่าน → ได้ {100 - Number(feePct)}% เป็น Diamond หลังหักคอม {feePct}% · ถอนธนาคารขั้นต่ำ {mockDb.WRITER_POLICY.minimum_payout} หรือแลก Gold 1:1
        </p>
        <div className="row-between" style={{ padding: '6px 0' }}>
          <span>Diamond ในกระเป๋า</span>
          <strong><CoinAmount value={diamond} currency="diamond" /></strong>
        </div>
        <div className="row-between" style={{ padding: '6px 0' }}><span>ยอดขาย (Gold)</span><strong>{dash!.earnings.sales_coins.toLocaleString()}</strong></div>
        <div className="row-between" style={{ padding: '6px 0' }}><span>ทิปจากผู้อ่าน</span><strong>{dash!.earnings.tip_coins.toLocaleString()}</strong></div>
        <div className="row-between" style={{ padding: '6px 0' }}><span>ค่าคอมแพลตฟอร์ม ({feePct}%)</span><strong>{dash!.earnings.platform_fee_coins.toLocaleString()}</strong></div>
        <div className="row-between" style={{ padding: '6px 0' }}><span>สุทธินักแปล</span><strong>{dash!.earnings.net_coins.toLocaleString()}</strong></div>
      </div>
      <div className="stat-grid mb-3">
        <div className="card stat"><div className="lbl">AVAILABLE</div><div className="val">{dash!.earnings.available.toLocaleString()} D</div></div>
        <div className="card stat"><div className="lbl">PENDING</div><div className="val">{dash!.earnings.pending.toLocaleString()} D</div></div>
        <div className="card stat"><div className="lbl">RESERVED</div><div className="val">{dash!.earnings.reserved.toLocaleString()} D</div></div>
        <div className="card stat"><div className="lbl">PAID</div><div className="val">{dash!.earnings.paid.toLocaleString()} D</div></div>
      </div>
      <form onSubmit={onSubmit} className="card mb-3" style={{ maxWidth: 480 }}>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          ถอนเข้าบัญชีธนาคาร (mock) · ขั้นต่ำ {mockDb.WRITER_POLICY.minimum_payout} Diamond · hold {mockDb.WRITER_POLICY.hold_days} วัน
        </p>
        <div className="field"><label>จำนวน Diamond</label>
          <input type="number" min={mockDb.WRITER_POLICY.minimum_payout} step={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {msg && <p style={{ color: 'var(--ok)', fontSize: 13 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-block">ขอถอนธนาคาร</button>
      </form>
      <form onSubmit={onConvert} className="card mb-3" style={{ maxWidth: 480 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>แลก Diamond → Gold (1:1)</strong>
        <div className="field"><label>จำนวน</label>
          <input type="number" min={1} step={1} value={convertAmt} onChange={(e) => setConvertAmt(Number(e.target.value))} />
        </div>
        <button type="submit" className="btn btn-ghost btn-block">แลกเป็น Gold</button>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Gold ที่ได้ใช้ซื้อตอนได้ · <Link to="/wallet">ดูกระเป๋า</Link>
        </p>
      </form>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>ประวัติคำขอ</h2>
      <div className="stack">
        {list.map((p) => (
          <div key={p.id} className="card row-between">
            <div>
              <div style={{ fontWeight: 600 }}>{p.amount.toLocaleString()} Diamond</div>
              <div className="muted" style={{ fontSize: 12 }}>{new Date(p.created_at).toLocaleString('th-TH')} · {p.bank_document_id}</div>
              {p.note && <div className="muted" style={{ fontSize: 12 }}>{p.note}</div>}
            </div>
            <Badge kind={p.status === 'paid' ? 'ok' : p.status === 'rejected' ? 'danger' : 'note'}>{p.status}</Badge>
          </div>
        ))}
        {list.length === 0 && <div className="card muted">ยังไม่มีคำขอ</div>}
      </div>
    </>
  );
}
