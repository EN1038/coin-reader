import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/supabase';
import type { Category, CategoryIconKey } from '../../lib/types';
import { CategoryIcon, IconSearch } from '../../components/icons';
import { errMessage } from '../../context/AppContext';
import { mockDb } from '../../lib/mock/store';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { Badge } from '../../components/Badge';

const ICON_OPTIONS: { value: CategoryIconKey; label: string }[] = [
  { value: 'book', label: 'หนังสือ' },
  { value: 'zap', label: 'แอ็กชัน' },
  { value: 'sparkles', label: 'แฟนตาซี' },
  { value: 'heart', label: 'โรแมนติก' },
  { value: 'ghost', label: 'สยองขวัญ' },
  { value: 'masks', label: 'ดราม่า' },
  { value: 'rocket', label: 'ไซไฟ' },
  { value: 'search', label: 'ลึกลับ' },
];

const emptyForm = {
  id: undefined as string | undefined,
  name: '',
  slug: '',
  icon_key: 'book' as CategoryIconKey,
  sort_order: 10,
  active: true,
};

export function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  const workCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of mockDb.getState().writerWorks) {
      for (const id of w.category_ids ?? []) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
      if (!w.category_ids?.length && w.category) {
        const cat = rows.find((c) => c.name === w.category || c.name.includes(w.category));
        if (cat) map.set(cat.id, (map.get(cat.id) ?? 0) + 1);
      }
    }
    return map;
  }, [rows]);

  async function reload() {
    const list = await api.listCategories(false);
    setRows(list);
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(qq) || r.slug.includes(qq));
  }, [rows, q]);

  function openCreate() {
    setForm({ ...emptyForm, sort_order: (rows.at(-1)?.sort_order ?? 0) + 1 });
    setError('');
    setOpen(true);
  }

  function openEdit(row: Category) {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon_key: row.icon_key,
      sort_order: row.sort_order,
      active: row.active,
    });
    setError('');
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setForm(emptyForm);
    setError('');
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.upsertCategory({
        id: form.id,
        name: form.name,
        slug: form.slug || form.name,
        icon_key: form.icon_key,
        sort_order: Number(form.sort_order) || 0,
        active: form.active,
      });
      closeModal();
      await reload();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('ลบหมวดหมู่นี้? เรื่องที่ใช้ยังอยู่ แต่ชิปหน้าแรกจะหาย')) return;
    setBusy(true);
    try {
      await api.deleteCategory(id);
      if (form.id === id) closeModal();
      await reload();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="หมวดหมู่"
        desc="CMS หมวดที่นักแปลเลือกตอนสร้างเรื่อง · เปิด/ปิด · เรียงลำดับ"
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + สร้างหมวด
          </button>
        }
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <IconSearch size={18} className="admin-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาหมวดหมู่..."
            aria-label="ค้นหาหมวดหมู่"
          />
        </label>
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} หมวด</span>
      </div>

      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ไอคอน</th>
              <th>ชื่อ</th>
              <th>Slug</th>
              <th>ลำดับ</th>
              <th>เรื่อง</th>
              <th>สถานะ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><CategoryIcon name={r.icon_key} size={18} /></td>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className="muted">{r.slug}</td>
                <td>{r.sort_order}</td>
                <td>{workCounts.get(r.id) ?? 0}</td>
                <td>
                  <Badge kind={r.active ? 'ok' : 'note'}>{r.active ? 'เปิด' : 'ปิด'}</Badge>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>แก้ไข</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 20 }}>ไม่พบหมวดหมู่</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal open={open} title={form.id ? 'แก้ไขหมวดหมู่' : 'สร้างหมวดหมู่'} onClose={closeModal}>
        <form className="admin-modal-form" onSubmit={onSave}>
          <label className="field">
            <span>ชื่อที่แสดง</span>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              required
              value={form.slug}
              placeholder="เช่น romance"
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </label>
          <div className="field">
            <span>ไอคอน</span>
            <PillMenu
              value={form.icon_key}
              options={ICON_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                icon: <CategoryIcon name={o.value} size={15} />,
              }))}
              onChange={(v) => setForm((f) => ({ ...f, icon_key: v }))}
              ariaLabel="เลือกไอคอน"
            />
          </div>
          <div className="admin-modal-row">
            <label className="field" style={{ flex: 1 }}>
              <span>ลำดับ</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              เปิดใช้งาน
            </label>
            <span className="admin-cat-preview" title="ตัวอย่างไอคอน">
              <CategoryIcon name={form.icon_key} size={22} />
            </span>
          </div>
          {error && <p className="admin-form-error">{error}</p>}
          <div className="admin-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
