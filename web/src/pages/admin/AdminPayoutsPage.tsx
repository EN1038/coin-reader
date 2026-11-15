import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { mockDb, type PayoutStatus } from '../../lib/mock/store';

type PayoutFilter = 'all' | PayoutStatus;

const OPTIONS: { value: PayoutFilter; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
  { value: 'paid', label: 'paid' },
];

export function AdminPayoutsPage() {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<PayoutFilter>('all');
  const list = mockDb.listPayouts();
  void tick;

  const filtered = useMemo(
    () => (status === 'all' ? list : list.filter((p) => p.status === status)),
    [list, status, tick],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader title="ถอน Diamond" desc="คิวถอนรายได้นักแปล · อนุมัติแล้วทำเครื่องหมายจ่าย" />
      <div className="admin-toolbar">
        <PillMenu value={status} options={OPTIONS} onChange={setStatus} ariaLabel="กรองสถานะถอน" />
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
      </div>
      <div className="admin-list">
        {filtered.map((p) => (
          <div key={p.id} className="admin-list-item">
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
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => { mockDb.reviewPayout(p.id, 'approved'); setTick((n) => n + 1); }}>อนุมัติ</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => { mockDb.reviewPayout(p.id, 'rejected'); setTick((n) => n + 1); }}>ปฏิเสธ</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { mockDb.payPayout(p.id); setTick((n) => n + 1); }}>จ่ายเลย (mock)</button>
                </>
              )}
              {p.status === 'approved' && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { mockDb.payPayout(p.id); setTick((n) => n + 1); }}>ทำเครื่องหมายจ่ายแล้ว</button>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="admin-list-item muted">ยังไม่มีคำขอถอน</div>}
      </div>
    </div>
  );
}
