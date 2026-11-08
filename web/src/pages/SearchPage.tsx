import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Work } from '../lib/types';
import { SeriesCard } from '../components/SeriesCard';
import { GENRES } from '../lib/mock/seed';

export function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [works, setWorks] = useState<Work[]>([]);
  const q = sp.get('q') ?? '';
  const kind = sp.get('kind') === 'manga' || sp.get('kind') === 'novel' ? sp.get('kind')! : '';
  const category = sp.get('category') ?? '';
  const status = sp.get('status') === 'completed' || sp.get('status') === 'published' ? sp.get('status')! : '';
  const sort = (sp.get('sort') as 'updated' | 'views' | 'rating' | 'new' | null) ?? 'updated';

  function set(next: Record<string, string>) {
    const params = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    setSp(params, { replace: true });
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      api.listWorks({
        q: q || undefined,
        kind: kind === 'novel' || kind === 'manga' ? kind : undefined,
        category: category || undefined,
        status: status === 'published' || status === 'completed' ? status : undefined,
        sort,
      }).then(setWorks).catch(() => setWorks([]));
    }, 120);
    return () => window.clearTimeout(t);
  }, [q, kind, category, status, sort]);

  return (
    <div className="discover">
      <div className="page-head">
        <h1>ค้นพบ</h1>
        <p className="muted">กรองตามประเภท หมวด สถานะ แล้วเรียงใหม่</p>
      </div>
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        <label>ค้นหา
          <input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="ชื่อเรื่องหรือนักเขียน" aria-label="คำค้น" />
        </label>
        <label>ประเภท
          <select value={kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="novel">นิยาย</option>
            <option value="manga">มังงะ</option>
          </select>
        </label>
        <label>หมวด
          <select value={category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">ทั้งหมด</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>สถานะ
          <select value={status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="published">กำลังดำเนินเรื่อง</option>
            <option value="completed">จบ</option>
          </select>
        </label>
        <label>เรียง
          <select value={sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="updated">อัปเดตล่าสุด</option>
            <option value="views">ยอดวิว</option>
            <option value="rating">คะแนน</option>
            <option value="new">มาใหม่</option>
          </select>
        </label>
      </form>
      <p className="result-count">{works.length} เรื่อง</p>
      {works.length === 0 ? (
        <p className="pad muted">ไม่พบเรื่องที่ตรงกับตัวกรอง</p>
      ) : (
        <div className="card-grid">
          {works.map((w) => <SeriesCard key={w.id} work={w} />)}
        </div>
      )}
    </div>
  );
}
