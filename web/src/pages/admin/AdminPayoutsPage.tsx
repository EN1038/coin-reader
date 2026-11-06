import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { mockDb } from '../../lib/mock/store';

export function AdminPayoutsPage() {
  const [tick, setTick] = useState(0);
  const list = mockDb.listPayouts();
  void tick;

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>ถอนเงินนักเขียน</h1>
      <div className="stack">
        {list.map((p) => (
          <div key={p.id} className="card">
            <div className="row-between">
              <div>
                <div style={{ fontWeight: 700 }}>฿ {p.amount.toLocaleString()}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.author_id} · {p.bank_document_id}</div>
                {p.note && <div className="muted" style={{ fontSize: 12 }}>{p.note}</div>}
              </div>
              <Badge kind={p.status === 'paid' ? 'ok' : p.status === 'rejected' ? 'danger' : 'note'}>{p.status}</Badge>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {p.status === 'pending' && (
                <>
                  <button type="button" className="btn btn-primary" style={{ minHeight: 36 }} onClick={() => { mockDb.reviewPayout(p.id, 'approved'); setTick((n) => n + 1); }}>อนุมัติ</button>
                  <button type="button" className="btn btn-danger" style={{ minHeight: 36 }} onClick={() => { mockDb.reviewPayout(p.id, 'rejected'); setTick((n) => n + 1); }}>ปฏิเสธ</button>
                  <button type="button" className="btn btn-ghost" style={{ minHeight: 36 }} onClick={() => { mockDb.payPayout(p.id); setTick((n) => n + 1); }}>จ่ายเลย (mock)</button>
                </>
              )}
              {p.status === 'approved' && (
                <button type="button" className="btn btn-primary" style={{ minHeight: 36 }} onClick={() => { mockDb.payPayout(p.id); setTick((n) => n + 1); }}>ทำเครื่องหมายจ่ายแล้ว</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
