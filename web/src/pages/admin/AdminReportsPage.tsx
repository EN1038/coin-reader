import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { mockDb } from '../../lib/mock/store';

export function AdminReportsPage() {
  const [tick, setTick] = useState(0);
  const list = mockDb.getState().helpReports;
  void tick;

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>รายงานปัญหา</h1>
      <p className="muted mb-3" style={{ fontSize: 13 }}>จาก /help/report · <strong>ไม่ใช่คิวคืนเหรียญ</strong></p>
      <div className="stack">
        {list.map((r) => (
          <div key={r.id} className="card">
            <div className="row-between">
              <div style={{ fontWeight: 700 }}>{r.subject}</div>
              <Badge kind={r.status === 'open' ? 'note' : 'ok'}>{r.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.category} · {r.email}</div>
            <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{r.detail}</p>
            {r.status === 'open' && (
              <button type="button" className="btn btn-primary mt-2" style={{ minHeight: 40 }} onClick={() => { mockDb.markHelpReviewed(r.id); setTick((n) => n + 1); }}>
                ทำเครื่องหมายตรวจแล้ว
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="card muted">ยังไม่มีรายงาน</div>}
      </div>
    </>
  );
}
