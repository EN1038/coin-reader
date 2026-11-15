import { useEffect, useState } from 'react';
import { api } from '../../lib/supabase';
import type { Category, CategoryIconKey } from '../../lib/types';
import { CategoryIcon } from '../../components/icons';
import { errMessage } from '../../context/AppContext';

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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    const list = await api.listCategories(false);
    setRows(list);
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, []);

  function edit(row: Category) {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon_key: row.icon_key,
      sort_order: row.sort_order,
      active: row.active,
    });
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
      setForm(emptyForm);
      await reload();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('ลบหมวดหมู่นี้? เรื่องที่ใช้ชื่อเดิมยังอยู่ แต่ชิปหน้าแรกจะหาย')) return;
    setBusy(true);
    try {
      await api.deleteCategory(id);
      if (form.id === id) setForm(emptyForm);
      await reload();
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>หมวดหมู่</h1>
        <p className="muted" style={{ fontSize: 13 }}>
          จัดการชื่อหมวด + ไอคอน SVG ที่แสดงบนหน้าแรกและตัวกรอง · mock เก็บในเครื่อง / production อ่านจากตาราง categories
        </p>
      </div>

      <form className="card pad" onSubmit={onSave} style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
        <strong>{form.id ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</strong>
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
        <label className="field">
          <span>ไอคอน</span>
          <select
            value={form.icon_key}
            onChange={(e) => setForm((f) => ({ ...f, icon_key: e.target.value as CategoryIconKey }))}
          >
            {ICON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>ลำดับ</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 18 }}>
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
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
          {form.id && (
            <button type="button" className="btn btn-ghost" onClick={() => setForm(emptyForm)}>
              ยกเลิกแก้ไข
            </button>
          )}
        </div>
      </form>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ไอคอน</th>
              <th>ชื่อ</th>
              <th>Slug</th>
              <th>ลำดับ</th>
              <th>สถานะ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><CategoryIcon name={r.icon_key} size={18} /></td>
                <td>{r.name}</td>
                <td className="muted">{r.slug}</td>
                <td>{r.sort_order}</td>
                <td>{r.active ? 'เปิด' : 'ปิด'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(r)}>แก้ไข</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
