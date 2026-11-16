import { useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { IconSearch } from '../../components/icons';
import { useApp } from '../../context/AppContext';
import { ageRatingLabel, mockDb, type WorkAdminStatus, type WriterWork } from '../../lib/mock/store';

type FilterStatus = 'all' | WorkAdminStatus;

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'published', label: 'published' },
  { value: 'draft', label: 'draft' },
  { value: 'suspended', label: 'suspended' },
  { value: 'takedown', label: 'takedown' },
];

export function AdminWorksPage() {
  const { user } = useApp();
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<WriterWork | null>(null);
  void tick;

  const works = mockDb.getState().writerWorks;
  const readerWorks = mockDb.works;
  const chapters = mockDb.getState().writerChapters;

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return works
      .filter((w) => (status === 'all' ? true : w.status === status))
      .filter((w) => {
        if (!qq) return true;
        return (
          w.title.toLowerCase().includes(qq) ||
          w.slug.toLowerCase().includes(qq) ||
          (w.original_title || '').toLowerCase().includes(qq) ||
          (w.category || '').toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [works, q, status, tick]);

  function viewsOf(id: string) {
    return readerWorks.find((w) => w.id === id)?.views ?? 0;
  }

  function chapterCount(id: string) {
    return chapters.filter((c) => c.work_id === id).length;
  }

  function setStatusOf(id: string, next: WorkAdminStatus) {
    mockDb.setWriterWorkStatus(
      id,
      next,
      user ? { id: user.id, name: user.display_name || user.email || 'แอดมิน' } : undefined,
    );
    setTick((n) => n + 1);
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status: next } : prev));
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="ผลงาน"
        desc="ค้นหา · กรอง · เปิดรายละเอียด · ระงับ/ปลดระงับ"
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <IconSearch size={18} className="admin-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาชื่อ / slug / หมวด"
            aria-label="ค้นหาผลงาน"
          />
        </label>
        <PillMenu
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
          ariaLabel="กรองสถานะ"
        />
        <span className="muted" style={{ fontSize: 12 }}>{rows.length} รายการ</span>
      </div>

      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>เรื่อง</th>
              <th>หมวด</th>
              <th>เรท</th>
              <th>ตอน</th>
              <th>วิว</th>
              <th>สถานะ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>
                  <button type="button" className="admin-linkish" onClick={() => setSelected(w)}>
                    <div style={{ fontWeight: 700 }}>{w.title}</div>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {w.kind} · {w.slug}
                    </div>
                  </button>
                </td>
                <td style={{ fontSize: 12, maxWidth: 160 }}>
                  {w.category || '—'}
                  {w.category_ids?.length > 1 && <span className="muted"> +{w.category_ids.length - 1}</span>}
                </td>
                <td>{ageRatingLabel(w.age_rating || 'all')}</td>
                <td>{chapterCount(w.id)}</td>
                <td>{viewsOf(w.id).toLocaleString('th-TH')}</td>
                <td>
                  <Badge
                    kind={
                      w.status === 'published'
                        ? 'ok'
                        : w.status === 'takedown' || w.status === 'suspended'
                          ? 'danger'
                          : 'note'
                    }
                  >
                    {w.status}
                  </Badge>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(w)}>ดู</button>
                  {w.status !== 'suspended' && w.status !== 'takedown' && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatusOf(w.id, 'suspended')}>ระงับ</button>
                  )}
                  {w.status === 'suspended' && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setStatusOf(w.id, 'published')}>ปลดระงับ</button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 20 }}>ไม่พบผลงาน</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={!!selected}
        title={selected ? selected.title : ''}
        onClose={() => setSelected(null)}
        wide
      >
        {selected && (
          <div className="admin-detail">
            <div className="admin-detail-grid">
              <div>
                <div className="muted" style={{ fontSize: 12 }}>ชื่อต้นฉบับ</div>
                <div>{selected.original_title || '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Slug</div>
                <div>/content/{selected.slug}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>ประเภท</div>
                <div>{selected.kind} · {selected.series_status === 'completed' ? 'จบแล้ว' : 'ยังไม่จบ'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>เรทอายุ</div>
                <div>{ageRatingLabel(selected.age_rating || 'all')}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>หมวด</div>
                <div>{selected.category || '—'}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>วิว / ตอน</div>
                <div>{viewsOf(selected.id).toLocaleString('th-TH')} · {chapterCount(selected.id)} ตอน</div>
              </div>
            </div>
            {(selected.short_synopsis || selected.synopsis) && (
              <p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>
                {selected.short_synopsis || selected.synopsis}
              </p>
            )}
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>ปิด</button>
              {selected.status !== 'suspended' && selected.status !== 'takedown' ? (
                <button type="button" className="btn btn-danger" onClick={() => setStatusOf(selected.id, 'suspended')}>
                  ระงับเรื่องนี้
                </button>
              ) : selected.status === 'suspended' ? (
                <button type="button" className="btn btn-primary" onClick={() => setStatusOf(selected.id, 'published')}>
                  ปลดระงับ
                </button>
              ) : null}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
