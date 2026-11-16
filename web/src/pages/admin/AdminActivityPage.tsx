import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { IconSearch } from '../../components/icons';
import {
  mockDb,
  type ActivityAction,
  type ActivityLogEntry,
} from '../../lib/mock/store';

type FilterAction = 'all' | ActivityAction;

const ACTION_OPTIONS: { value: FilterAction; label: string }[] = [
  { value: 'all', label: 'ทุกประเภท' },
  { value: 'work_create', label: 'สร้างเรื่อง' },
  { value: 'work_update', label: 'อัปเดตเรื่อง' },
  { value: 'chapter_create', label: 'สร้างตอน' },
  { value: 'chapter_update', label: 'อัปเดตตอน' },
  { value: 'work_status', label: 'เปลี่ยนสถานะ' },
  { value: 'category_upsert', label: 'หมวดหมู่' },
  { value: 'category_delete', label: 'ลบหมวด' },
  { value: 'banner_upsert', label: 'แบนเนอร์' },
  { value: 'banner_delete', label: 'ลบแบนเนอร์' },
  { value: 'site_asset_update', label: 'ภาพเริ่มต้น' },
  { value: 'site_asset_reset', label: 'รีเซ็ตภาพ' },
  { value: 'author_review', label: 'คิวนักแปล' },
  { value: 'takedown_review', label: 'Takedown' },
];

function actionBadgeKind(action: ActivityAction): 'ok' | 'note' | 'danger' | 'ex' {
  if (action === 'work_status' || action === 'takedown_review' || action === 'category_delete') return 'danger';
  if (action === 'author_review') return 'note';
  if (action.startsWith('chapter')) return 'ex';
  return 'ok';
}

function actionLabel(action: ActivityAction): string {
  return ACTION_OPTIONS.find((o) => o.value === action)?.label ?? action;
}

export function AdminActivityPage() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState<FilterAction>('all');
  const [tick, setTick] = useState(0);
  void tick;

  const rows = useMemo(
    () => mockDb.listActivityLog({ q, action, limit: 200 }),
    [q, action, tick],
  );

  function refresh() {
    setTick((n) => n + 1);
  }

  function linkFor(e: ActivityLogEntry) {
    if (e.target_type === 'author') return `/admin/authors/${e.target_id}`;
    if (e.work_id || e.target_type === 'work' || e.target_type === 'chapter') return '/admin/works';
    if (e.target_type === 'category') return '/admin/categories';
    if (e.target_type === 'banner') return '/admin/banners';
    if (e.target_type === 'site_asset') return '/admin/assets';
    if (e.target_type === 'takedown') return '/admin/takedowns';
    return null;
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="บันทึกการอัปเดต"
        desc="ใครสร้าง/แก้เรื่อง ตอน หมวด หรือเปลี่ยนสถานะ — จาก mock store"
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <IconSearch size={18} className="admin-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาผู้ทำ / เรื่อง / สรุป"
            aria-label="ค้นหาบันทึก"
          />
        </label>
        <PillMenu
          value={action}
          options={ACTION_OPTIONS}
          onChange={setAction}
          ariaLabel="กรองประเภท"
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>
          รีเฟรช
        </button>
        <span className="muted" style={{ fontSize: 12 }}>{rows.length} รายการ</span>
      </div>

      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ผู้ทำ</th>
              <th>ประเภท</th>
              <th>สรุป</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const href = linkFor(e);
              return (
                <tr key={e.id}>
                  <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(e.at).toLocaleString('th-TH')}
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.actor_name}</td>
                  <td>
                    <Badge kind={actionBadgeKind(e.action)}>{actionLabel(e.action)}</Badge>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.summary}</div>
                    {e.work_title && e.work_title !== e.summary && (
                      <div className="muted" style={{ fontSize: 11 }}>{e.work_title}</div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {href && (
                      <Link className="btn btn-ghost btn-sm" to={href}>
                        เปิด
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 20 }}>ยังไม่มีบันทึก</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
