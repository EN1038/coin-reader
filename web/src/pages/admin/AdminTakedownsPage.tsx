import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { mockDb } from '../../lib/mock/store';

type TdFilter = 'all' | 'received' | 'reviewing' | 'resolved' | 'rejected';

const OPTIONS: { value: TdFilter; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'received', label: 'received' },
  { value: 'reviewing', label: 'reviewing' },
  { value: 'resolved', label: 'resolved' },
  { value: 'rejected', label: 'rejected' },
];

export function AdminTakedownsPage() {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<TdFilter>('all');
  const list = mockDb.getState().takedownRequests;
  void tick;

  const filtered = useMemo(
    () => (status === 'all' ? list : list.filter((r) => r.status === status)),
    [list, status, tick],
  );

  function act(id: string, decision: 'reviewing' | 'resolved' | 'rejected') {
    mockDb.reviewTakedown(id, decision, decision === 'resolved' ? 'takedown mock' : decision);
    setTick((n) => n + 1);
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Takedown"
        desc="เมื่อ resolved จะตั้งงาน writer เป็น takedown · ไม่คืนเหรียญผู้อ่าน"
      />
      <div className="admin-toolbar">
        <PillMenu value={status} options={OPTIONS} onChange={setStatus} ariaLabel="กรองสถานะ takedown" />
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
      </div>
      <div className="admin-list">
        {filtered.map((r) => (
          <div key={r.id} className="admin-list-item">
            <div className="row-between">
              <div style={{ fontWeight: 700 }}>{r.reporter_name}</div>
              <Badge kind={r.status === 'resolved' ? 'ok' : r.status === 'rejected' ? 'danger' : 'note'}>{r.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{r.reporter_email} · {r.work_url}</div>
            <p style={{ fontSize: 13, marginTop: 8 }}>{r.detail}</p>
            {(r.status === 'received' || r.status === 'reviewing') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {r.status === 'received' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(r.id, 'reviewing')}>เริ่มตรวจ</button>
                )}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => act(r.id, 'resolved')}>Takedown</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(r.id, 'rejected')}>ปฏิเสธ</button>
              </div>
            )}
          </div>
        ))}
        {!filtered.length && <div className="admin-list-item muted">ยังไม่มีคำขอ</div>}
      </div>
    </div>
  );
}
