import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Work } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { WorkListCard } from '../components/CoverCard';
import { useApp } from '../context/AppContext';

export function LibraryPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/library'); return; }
    (async () => {
      const shelf = await api.listBookshelf();
      const all = await api.listWorks();
      setWorks(shelf.map((s) => all.find((w) => w.id === s.work_id)).filter(Boolean) as Work[]);
    })();
  }, [user, nav]);

  return (
    <>
      <Topbar title="ชั้นหนังสือ" />
      <div className="sec"><h2>เรื่องที่บันทึก</h2><span className="ex">ตัวอย่าง</span></div>
      {works.length === 0 && (
        <div className="pad center muted">
          <p>ยังไม่มีเรื่องในชั้น</p>
          <Link to="/search" className="btn btn-primary btn-sm mt-3" style={{ display: 'inline-flex' }}>ค้นหาเรื่อง</Link>
        </div>
      )}
      {works.length > 0 && (
        <div className="work-grid work-list">
          {works.map((w) => <WorkListCard key={w.id} work={w} />)}
        </div>
      )}
    </>
  );
}
