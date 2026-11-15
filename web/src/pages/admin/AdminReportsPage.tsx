import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { mockDb } from '../../lib/mock/store';

type ReportFilter = 'all' | 'open' | 'reviewed';

const OPTIONS: { value: ReportFilter; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'open', label: 'open' },
  { value: 'reviewed', label: 'reviewed' },
];

export function AdminReportsPage() {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<ReportFilter>('all');
  const list = mockDb.getState().helpReports;
  void tick;

  const filtered = useMemo(
    () => (status === 'all' ? list : list.filter((r) => r.status === status)),
    [list, status, tick],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader title="รายงาน" desc="จาก /help/report · ไม่ใช่คิวคืนเหรียญ" />
      <div className="admin-toolbar">
        <PillMenu value={status} options={OPTIONS} onChange={setStatus} ariaLabel="กรองสถานะรายงาน" />
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
      </div>
      <div className="admin-list">
        {filtered.map((r) => (
          <div key={r.id} className="admin-list-item">
            <div className="row-between">
              <div style={{ fontWeight: 700 }}>{r.subject}</div>
              <Badge kind={r.status === 'open' ? 'note' : 'ok'}>{r.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.category} · {r.email}</div>
            <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{r.detail}</p>
            {r.status === 'open' && (
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={() => { mockDb.markHelpReviewed(r.id); setTick((n) => n + 1); }}
              >
                ทำเครื่องหมายตรวจแล้ว
              </button>
            )}
          </div>
        ))}
        {!filtered.length && <div className="admin-list-item muted">ยังไม่มีรายงาน</div>}
      </div>
    </div>
  );
}
