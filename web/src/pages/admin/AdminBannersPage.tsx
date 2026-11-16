import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/supabase';
import type { HeroBanner } from '../../lib/types';
import { IconSearch } from '../../components/icons';
import { errMessage } from '../../context/AppContext';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { Badge } from '../../components/Badge';
import { useSiteAsset } from '../../context/SiteAssetsContext';
import { optimizeImageFile } from '../../lib/optimizeImage';

export function AdminBannersPage() {
  const heroFallback = useSiteAsset('hero_fallback');
  const emptyForm = {
    id: undefined as string | undefined,
    title: '',
    alt: '',
    image_url: heroFallback,
    href: '/discover',
    sort_order: 1,
    active: true,
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<HeroBanner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  async function reload() {
    const list = await api.listBanners(false);
    setRows(list);
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(qq)
        || r.href.toLowerCase().includes(qq)
        || r.alt.toLowerCase().includes(qq),
    );
  }, [rows, q]);

  function openCreate() {
    setForm({
      ...emptyForm,
      sort_order: (rows.at(-1)?.sort_order ?? 0) + 1,
      image_url: heroFallback,
    });
    setError('');
    setOpen(true);
  }

  function openEdit(row: HeroBanner) {
    setForm({
      id: row.id,
      title: row.title,
      alt: row.alt,
      image_url: row.image_url,
      href: row.href,
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

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const out = await optimizeImageFile(file, {
        maxEdge: 1920,
        maxBytes: 1_200_000,
        quality: 0.82,
      });
      setForm((f) => ({ ...f, image_url: out.dataUrl }));
    } catch (err) {
      setError(errMessage(err));
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.upsertBanner({
        id: form.id,
        title: form.title,
        alt: form.alt || form.title,
        image_url: form.image_url,
        href: form.href || '/discover',
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
    if (!window.confirm('ลบแบนเนอร์นี้?')) return;
    setBusy(true);
    try {
      await api.deleteBanner(id);
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
        title="แบนเนอร์หน้าแรก"
        desc="สไลด์โปรโมทเรื่องฮิต · อัปโหลดรูป · ลิงก์ปลายทาง · เรียงลำดับ / เปิด-ปิด"
        action={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + เพิ่มแบนเนอร์
          </button>
        }
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <IconSearch size={18} className="admin-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหาแบนเนอร์..."
            aria-label="ค้นหาแบนเนอร์"
          />
        </label>
        <span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
      </div>

      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>รูป</th>
              <th>ชื่อ</th>
              <th>ลิงก์</th>
              <th>ลำดับ</th>
              <th>สถานะ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <img className="admin-banner-thumb" src={r.image_url} alt="" width={96} height={32} />
                </td>
                <td style={{ fontWeight: 600 }}>{r.title}</td>
                <td className="muted">{r.href}</td>
                <td>{r.sort_order}</td>
                <td>
                  <Badge kind={r.active ? 'ok' : 'note'}>{r.active ? 'เปิด' : 'ปิด'}</Badge>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>แก้ไข</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(r.id)}>ลบ</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 20 }}>ยังไม่มีแบนเนอร์</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal open={open} title={form.id ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์'} onClose={closeModal}>
        <form onSubmit={onSave}>
          <div className="field">
            <label htmlFor="banner-title">ชื่อ (ภายใน)</label>
            <input
              id="banner-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="banner-alt">คำอธิบายรูป (alt)</label>
            <input
              id="banner-alt"
              value={form.alt}
              onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
              maxLength={160}
              placeholder="ข้อความบนแบนเนอร์ / สำหรับ accessibility"
            />
          </div>
          <div className="field">
            <label htmlFor="banner-href">ลิงก์เมื่อคลิก</label>
            <input
              id="banner-href"
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              placeholder="/discover หรือ /works/slug"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="banner-order">ลำดับ</label>
            <input
              id="banner-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </div>
          <div className="field">
            <label>รูปแบนเนอร์</label>
            <div className="admin-banner-preview">
              {form.image_url ? (
                <img src={form.image_url} alt="" />
              ) : (
                <span className="muted">ยังไม่มีรูป</span>
              )}
            </div>
            <p className="hint" style={{ marginTop: 6 }}>
              รับ JPEG / PNG / WebP / GIF · ระบบจะแปลงเก็บไฟล์เล็กสุด (WebP/JPEG) · GIF/WebP เคลื่อนไหวเก็บแอนิเมชันไว้
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                อัปโหลดรูป
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setForm((f) => ({ ...f, image_url: heroFallback }))}
              >
                ใช้รูปเริ่มต้น
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void onPickImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            แสดงบนหน้าแรก
          </label>
          {error && <p className="admin-form-error">{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={closeModal} style={{ flex: 1 }}>ยกเลิก</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
