import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { mockDb, type AuthorRecord, type AuthorStatus } from '../../lib/mock/store';

type AuthorFilter = 'all' | AuthorStatus;

const AUTHOR_STATUS_OPTIONS: { value: AuthorFilter; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'pending' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
  { value: 'suspended', label: 'suspended' },
];

export function AdminAuthorsPage() {
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<AuthorRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('เอกสารไม่ครบ (mock)');
  const [status, setStatus] = useState<AuthorFilter>('all');
  const list = mockDb.listAuthorsRegistry();
  void tick;

  const filtered = useMemo(
    () => (status === 'all' ? list : list.filter((a) => a.status === status)),
    [list, status, tick],
  );

  function refresh() {
    setTick((n) => n + 1);
  }

  function approve(id: string) {
    mockDb.reviewAuthor(id, 'approved');
    setSelected(null);
    refresh();
  }

  function reject(id: string) {
    mockDb.reviewAuthor(id, 'rejected', rejectReason.trim() || 'ไม่อนุมัติ');
    setSelected(null);
    setRejectReason('เอกสารไม่ครบ (mock)');
    refresh();
  }

  return (
    <div className="admin-page">
      <AdminPageHeader title="คิวนักแปล" desc="อนุมัติ / ปฏิเสธใบสมัคร — เปิด modal ตรวจรายละเอียด" />
      <div className="admin-toolbar">
        <PillMenu
          value={status}
          options={AUTHOR_STATUS_OPTIONS}
          onChange={setStatus}
          ariaLabel="กรองสถานะนักแปล"
        />
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
      </div>
      <div className="admin-list">
        {filtered.map((a) => (
          <div key={a.id} className="admin-list-item">
            <div className="row-between" style={{ gap: 12 }}>
              <button type="button" className="admin-linkish" onClick={() => setSelected(a)} style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>{a.display_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{a.id} · user {a.user_id}</div>
                {a.bio && <p style={{ fontSize: 13, marginTop: 6 }}>{a.bio}</p>}
              </button>
              <Badge kind={a.status === 'approved' ? 'ok' : a.status === 'pending' ? 'note' : 'danger'}>{a.status}</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Link to={`/admin/authors/${a.id}`} className="btn btn-ghost btn-sm">ดูเรื่อง / จัดการ</Link>
              {a.status === 'pending' && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}>ตรวจ</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => approve(a.id)}>อนุมัติ</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setSelected(a)}>ปฏิเสธ…</button>
                </>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="admin-list-item muted">ยังไม่มีใบสมัคร</div>}
      </div>

      <AdminModal
        open={!!selected}
        title={selected ? `ใบสมัคร · ${selected.display_name}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="admin-detail">
            <div className="admin-detail-grid">
              <div>
                <div className="muted" style={{ fontSize: 12 }}>นามปากกา</div>
                <div>{selected.display_name}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>สถานะ</div>
                <Badge kind={selected.status === 'approved' ? 'ok' : selected.status === 'pending' ? 'note' : 'danger'}>
                  {selected.status}
                </Badge>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Author ID</div>
                <div style={{ fontSize: 12 }}>{selected.id}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>User ID</div>
                <div style={{ fontSize: 12 }}>{selected.user_id}</div>
              </div>
            </div>
            {selected.bio && (
              <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>{selected.bio}</p>
            )}
            {selected.reject_reason && (
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>เหตุผลก่อนหน้า: {selected.reject_reason}</p>
            )}
            {selected.status === 'pending' && (
              <>
                <label className="field" style={{ marginTop: 12 }}>
                  <span>เหตุผลถ้าปฏิเสธ</span>
                  <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                </label>
                <div className="admin-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>ปิด</button>
                  <button type="button" className="btn btn-danger" onClick={() => reject(selected.id)}>ปฏิเสธ</button>
                  <button type="button" className="btn btn-primary" onClick={() => approve(selected.id)}>อนุมัติ</button>
                </div>
              </>
            )}
            {selected.status !== 'pending' && (
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>ปิด</button>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
