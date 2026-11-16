import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockDb } from '../../lib/mock/store';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { Badge } from '../../components/Badge';
import { api } from '../../lib/supabase';
import type { CategoryIconKey } from '../../lib/types';
import { CategoryIcon } from '../../components/icons';
import { errMessage } from '../../context/AppContext';
import { useSiteAsset } from '../../context/SiteAssetsContext';

const ICON_KEYS: CategoryIconKey[] = ['book', 'zap', 'sparkles', 'heart', 'ghost', 'masks', 'rocket', 'search'];

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
}) {
  return (
    <div className="card stat">
      <div className="lbl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <img src={icon} alt="" width={14} height={14} />}
        {label}
      </div>
      <div className="val">{typeof value === 'number' ? value.toLocaleString('th-TH') : value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function AdminDashboard() {
  const s = mockDb.adminSummary();
  const goldIcon = useSiteAsset('currency_gold');
  const diamondIcon = useSiteAsset('currency_diamond');
  const [catOpen, setCatOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [iconKey, setIconKey] = useState<CategoryIconKey>('book');

  const todos = [
    { to: '/admin/authors', label: 'คิวอนุมัตินักแปล', n: s.authors_pending },
    { to: '/admin/payouts', label: 'ถอน Diamond รอตรวจ', n: s.payouts_pending },
    { to: '/admin/reports', label: 'รายงานรอตรวจ', n: s.reports_open },
    { to: '/admin/takedowns', label: 'Takedown เปิด', n: s.takedowns_open },
  ];

  const recentLedger = useMemo(
    () => [...mockDb.getState().ledger].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
    [],
  );

  const topWorks = useMemo(
    () => [...mockDb.works].sort((a, b) => b.views - a.views).slice(0, 5),
    [],
  );

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.upsertCategory({
        name: name.trim(),
        slug: slug.trim() || name.trim(),
        icon_key: iconKey,
        sort_order: 99,
        active: true,
      });
      setCatOpen(false);
      setName('');
      setSlug('');
      setIconKey('book');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Dashboard"
        desc="ภาพรวมแพลตฟอร์ม · คิวงาน · กิจกรรมล่าสุด"
        action={
          <button type="button" className="btn btn-primary" onClick={() => setCatOpen(true)}>
            + สร้างหมวด
          </button>
        }
      />

      <div className="admin-dash-grid">
        <div>
          <div className="admin-section-h" style={{ marginTop: 0 }}>เศรษฐกิจ</div>
          <div className="stat-grid admin-stat-4">
            <Stat label="Gold ในระบบ" value={s.gold_liability} icon={goldIcon} sub="liability นักอ่าน" />
            <Stat label="Diamond ค้างจ่าย" value={s.diamond_outstanding} icon={diamondIcon} sub="รวมนักแปล" />
            <Stat label="เติมวันนี้" value={s.topup_today} icon={goldIcon} />
            <Stat label="GMV วันนี้" value={s.gmv_today} icon={goldIcon} sub="ปลดล็อก + ทิป" />
          </div>

          <div className="admin-section-h">การใช้งาน</div>
          <div className="stat-grid admin-stat-4">
            <Stat label="เรื่องเผยแพร่" value={s.works_published} sub={`ทั้งหมด ${s.works_total}`} />
            <Stat label="ตอนเผยแพร่" value={s.chapters_published} />
            <Stat label="วิวรวม" value={s.views_total} />
            <Stat label="หมวดที่เปิด" value={s.categories_active} />
          </div>

          <div className="admin-section-h">ต้องทำวันนี้</div>
          <div className="admin-todo">
            {todos.map((t) => (
              <Link key={t.to} to={t.to} className={t.n ? undefined : 'is-clear'}>
                <span>{t.label}</span>
                <span className="n">{t.n}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-dash-side">
          <div className="admin-panel">
            <div className="admin-panel-h">
              <span>ธุรกรรมล่าสุด</span>
              <Link to="/admin/ledger">ดูทั้งหมด</Link>
            </div>
            <ul className="admin-feed">
              {recentLedger.map((e) => (
                <li key={e.id}>
                  <div>
                    <strong>{e.label}</strong>
                    <span className="muted">{e.kind} · {new Date(e.created_at).toLocaleString('th-TH')}</span>
                  </div>
                  <em style={{ color: e.amount >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                    {e.amount >= 0 ? '+' : ''}{e.amount}
                  </em>
                </li>
              ))}
              {!recentLedger.length && <li className="muted">ยังไม่มีรายการ</li>}
            </ul>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-h">
              <span>เรื่องยอดวิวสูง</span>
              <Link to="/admin/works">จัดการ</Link>
            </div>
            <ul className="admin-feed">
              {topWorks.map((w, i) => (
                <li key={w.id}>
                  <div>
                    <strong>{i + 1}. {w.title}</strong>
                    <span className="muted">{w.category} · <Badge kind="ex">{w.rating}</Badge></span>
                  </div>
                  <em>{w.views.toLocaleString('th-TH')}</em>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-h"><span>ทางลัด</span></div>
            <div className="admin-quick">
              <Link className="btn btn-ghost btn-sm" to="/admin/works">ผลงาน</Link>
              <Link className="btn btn-ghost btn-sm" to="/admin/categories">หมวดหมู่</Link>
              <Link className="btn btn-ghost btn-sm" to="/admin/authors">คิวนักแปล</Link>
              <Link className="btn btn-ghost btn-sm" to="/admin/payouts">ถอนเงิน</Link>
              <Link className="btn btn-ghost btn-sm" to="/admin/reports">รายงาน</Link>
              <Link className="btn btn-ghost btn-sm" to="/admin/takedowns">Takedown</Link>
            </div>
          </div>
        </div>
      </div>

      <AdminModal open={catOpen} title="สร้างหมวดหมู่" onClose={() => setCatOpen(false)}>
        <form className="admin-modal-form" onSubmit={createCategory}>
          <label className="field">
            <span>ชื่อที่แสดง</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Slug</span>
            <input value={slug} placeholder="auto จากชื่อได้" onChange={(e) => setSlug(e.target.value)} />
          </label>
          <div className="field">
            <span>ไอคอน</span>
            <div className="admin-modal-row">
              <PillMenu
                value={iconKey}
                options={ICON_KEYS.map((k) => ({
                  value: k,
                  label: k,
                  icon: <CategoryIcon name={k} size={15} />,
                }))}
                onChange={setIconKey}
                ariaLabel="เลือกไอคอน"
              />
              <span className="admin-cat-preview"><CategoryIcon name={iconKey} size={22} /></span>
            </div>
          </div>
          {error && <p className="admin-form-error">{error}</p>}
          <div className="admin-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setCatOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? '…' : 'บันทึก'}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
