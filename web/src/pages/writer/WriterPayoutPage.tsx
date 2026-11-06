import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterPayoutPage() {
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const [amount, setAmount] = useState(100);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const dash = author ? mockDb.writerDashboard(author.id) : null;
  const list = useMemo(() => (author ? mockDb.listPayouts(author.id) : []), [author, tick]);
  if (gate) return gate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      mockDb.requestPayout(author!.id, amount, mockDb.BANK_DOC_FIXTURE);
      setMsg('ส่งคำขอถอนแล้ว (mock · สถานะ pending)');
      setTick((n) => n + 1);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'BELOW_MINIMUM') setError(`ขั้นต่ำถอน ฿${mockDb.WRITER_POLICY.minimum_payout} (ตัวอย่าง)`);
      else if (code === 'INSUFFICIENT_AVAILABLE') setError('ยอด AVAILABLE ไม่พอ');
      else setError('ขอถอนไม่สำเร็จ');
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>รายได้ / ขอถอน</h1>
      <div className="stat-grid mb-3">
        <div className="card stat"><div className="lbl">AVAILABLE</div><div className="val">฿ {dash!.earnings.available.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">PENDING</div><div className="val">฿ {dash!.earnings.pending.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">RESERVED</div><div className="val">฿ {dash!.earnings.reserved.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">PAID</div><div className="val">฿ {dash!.earnings.paid.toLocaleString()}</div></div>
      </div>
      <form onSubmit={onSubmit} className="card mb-3" style={{ maxWidth: 480 }}>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          เอกสารบัญชี fixture: <code>{mockDb.BANK_DOC_FIXTURE}</code> · ขั้นต่ำ ฿{mockDb.WRITER_POLICY.minimum_payout} · hold {mockDb.WRITER_POLICY.hold_days} วัน (placeholder)
        </p>
        <div className="field"><label>จำนวนเงิน (บาท)</label>
          <input type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {msg && <p style={{ color: 'var(--ok)', fontSize: 13 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-block">ขอถอน (mock)</button>
      </form>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>ประวัติคำขอ</h2>
      <div className="stack">
        {list.map((p) => (
          <div key={p.id} className="card row-between">
            <div>
              <div style={{ fontWeight: 600 }}>฿ {p.amount.toLocaleString()}</div>
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
