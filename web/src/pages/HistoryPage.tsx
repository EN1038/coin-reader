import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { ReadingProgress, Work, Chapter } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { Cover } from '../components/CoverCard';
import { useApp } from '../context/AppContext';

export function HistoryPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const [rows, setRows] = useState<Array<{ progress: ReadingProgress; work: Work; chapter: Chapter }>>([]);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/history'); return; }
    (async () => {
      const hist = await api.listHistory();
      const out = [];
      for (const p of hist) {
        try {
          const work = await api.getWork(p.work_id);
          const chapter = await api.getChapter(p.chapter_id);
          out.push({ progress: p, work, chapter });
        } catch { /* skip */ }
      }
      setRows(out);
    })();
  }, [user, nav]);

  return (
    <>
      <Topbar title="ประวัติการอ่าน" />
      <div className="sec"><h2>อ่านล่าสุด</h2><span className="ex">ตัวอย่าง</span></div>
      {rows.length === 0 && (
        <div className="pad center muted">
          <p>ยังไม่มีประวัติ</p>
          <Link to="/" className="btn btn-primary btn-sm mt-3" style={{ display: 'inline-flex' }}>ไปหน้าแรก</Link>
        </div>
      )}
      {rows.length > 0 && (
        <div className="work-grid work-list">
          {rows.map(({ progress, work, chapter }) => (
            <Link
              key={`${progress.work_id}-${progress.chapter_id}`}
              to={work.kind === 'manga' ? `/read/manga/${work.id}/${chapter.id}` : `/read/novel/${work.id}/${chapter.id}`}
              className="work-list-card"
            >
              <div className="thumb"><Cover work={work} /></div>
              <div className="meta">
                <div className="t">{work.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตอนที่ {chapter.number} — {chapter.title}</div>
                <div className="ex" style={{ marginTop: 4 }}>
                  {new Date(progress.updated_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} · Asia/Bangkok
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
