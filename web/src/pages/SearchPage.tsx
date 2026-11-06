import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Work } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { WorkListCard } from '../components/CoverCard';

const CATS = ['ทั้งหมด', 'นิยาย', 'มังงะ', 'โรแมนติก', 'แฟนตาซี', 'สยองขวัญ', 'ไซไฟ'];

export function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [cat, setCat] = useState(sp.get('kind') === 'manga' ? 'มังงะ' : 'ทั้งหมด');
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const params: Parameters<typeof api.listWorks>[0] = { q: q || undefined };
      if (cat === 'นิยาย') params!.kind = 'novel';
      else if (cat === 'มังงะ') params!.kind = 'manga';
      else if (cat !== 'ทั้งหมด') params!.category = cat;
      setWorks(await api.listWorks(params));
    }, 150);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <>
      <Topbar title="ค้นหา" />
      <div className="searchbar">
        <span>⌕</span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSp(e.target.value ? { q: e.target.value } : {});
          }}
          placeholder="เรื่อง นักเขียน หมวด…"
          aria-label="ค้นหา"
        />
      </div>
      <div className="chips">
        {CATS.map((c) => (
          <button key={c} type="button" className={cat === c ? 'on' : undefined} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="sec" style={{ paddingBottom: 4 }}>
        <h2>ผลการค้นหา</h2>
        <span className="ex">{works.length} เรื่อง · ตัวอย่าง</span>
      </div>
      {works.length === 0 && <p className="center muted p-4">ไม่พบเรื่องที่ตรงเงื่อนไข</p>}
      {works.map((w) => (
        <WorkListCard key={w.id} work={w} />
      ))}
    </>
  );
}
