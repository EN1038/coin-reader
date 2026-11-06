import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { mockDb } from '../../lib/mock/store';

export function AdminTakedownsPage() {
  const [tick, setTick] = useState(0);
  const list = mockDb.getState().takedownRequests;
  void tick;

  function act(id: string, decision: 'reviewing' | 'resolved' | 'rejected') {
    mockDb.reviewTakedown(id, decision, decision === 'resolved' ? 'takedown mock' : decision);
    setTick((n) => n + 1);
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Takedown</h1>
      <p className="muted mb-3" style={{ fontSize: 13 }}>เมื่อ resolved จะตั้งงาน writer เป็น takedown (mock) · <strong>ไม่คืนเหรียญผู้อ่าน</strong></p>
      <div className="stack">
        {list.map((r) => (
          <div key={r.id} className="card">
            <div className="row-between">
              <div style={{ fontWeight: 700 }}>{r.reporter_name}</div>
              <Badge kind={r.status === 'resolved' ? 'ok' : r.status === 'rejected' ? 'danger' : 'note'}>{r.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{r.reporter_email} · {r.work_url}</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>{r.detail}</p>
            {(r.status === 'received' || r.status === 'reviewing') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {r.status === 'received' && <button type="button" className="btn btn-ghost" style={{ minHeight: 36 }} onClick={() => act(r.id, 'reviewing')}>เริ่มตรวจ</button>}
                <button type="button" className="btn btn-danger" style={{ minHeight: 36 }} onClick={() => act(r.id, 'resolved')}>Takedown</button>
                <button type="button" className="btn btn-ghost" style={{ minHeight: 36 }} onClick={() => act(r.id, 'rejected')}>ปฏิเสธ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
