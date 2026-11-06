import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { mockDb } from '../../lib/mock/store';

export function AdminAuthorsPage() {
  const [tick, setTick] = useState(0);
  const list = mockDb.listAuthorsRegistry();
  void tick;

  function act(id: string, decision: 'approved' | 'rejected') {
    const reason = decision === 'rejected' ? window.prompt('เหตุผล (อย่างน้อยสั้น ๆ)', 'เอกสารไม่ครบ (mock)') || 'ไม่อนุมัติ' : undefined;
    mockDb.reviewAuthor(id, decision, reason);
    setTick((n) => n + 1);
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>คิวอนุมัตินักเขียน</h1>
      <div className="stack">
        {list.map((a) => (
          <div key={a.id} className="card">
            <div className="row-between" style={{ gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{a.display_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{a.id} · user {a.user_id}</div>
                {a.bio && <p style={{ fontSize: 13, marginTop: 6 }}>{a.bio}</p>}
                {a.reject_reason && <p className="muted" style={{ fontSize: 12 }}>เหตุผล: {a.reject_reason}</p>}
              </div>
              <Badge kind={a.status === 'approved' ? 'ok' : a.status === 'pending' ? 'note' : 'danger'}>{a.status}</Badge>
            </div>
            {a.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-primary" style={{ minHeight: 40 }} onClick={() => act(a.id, 'approved')}>อนุมัติ</button>
                <button type="button" className="btn btn-danger" style={{ minHeight: 40 }} onClick={() => act(a.id, 'rejected')}>ปฏิเสธ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
