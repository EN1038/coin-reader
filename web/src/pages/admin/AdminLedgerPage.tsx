import { mockDb } from '../../lib/mock/store';
import { Badge } from '../../components/Badge';

export function AdminLedgerPage() {
  const ledger = mockDb.getState().ledger;
  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>ธุรกรรม / Ledger</h1>
      <p className="muted mb-3" style={{ fontSize: 13 }}>อ่านอย่างเดียวจาก mock store · client ไม่เขียน ledger โดยตรงใน flow ผู้อ่าน</p>
      <div className="stack">
        {ledger.map((e) => (
          <div key={e.id} className="card row-between">
            <div>
              <div style={{ fontWeight: 600 }}>{e.label}</div>
              <div className="muted" style={{ fontSize: 12 }}>{e.kind} · {e.transaction_id} · {new Date(e.created_at).toLocaleString('th-TH')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: e.amount >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{e.amount >= 0 ? '+' : ''}{e.amount}</div>
              <Badge kind="ex">🪙 {e.coins}</Badge>
            </div>
          </div>
        ))}
        {ledger.length === 0 && <div className="card muted">ว่าง</div>}
      </div>
    </>
  );
}
