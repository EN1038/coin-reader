import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { ReadingProgress, Work } from '../lib/types';
import { SeriesCard } from '../components/SeriesCard';
import { useApp } from '../context/AppContext';
import { relativeTime } from '../lib/format';

export function LibraryPage() {
  const { user } = useApp();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'history' ? 'history' : 'followed';
  const [followed, setFollowed] = useState<Work[]>([]);
  const [history, setHistory] = useState<Array<{ progress: ReadingProgress; work?: Work; chapterLabel: string }>>([]);

  useEffect(() => {
    if (!user) { nav('/auth/login?next=/library'); return; }
    (async () => {
      const [shelf, all, hist] = await Promise.all([
        api.listBookshelf(),
        api.listWorks(),
        api.listHistory(),
      ]);
      setFollowed(shelf.map((s) => all.find((w) => w.id === s.work_id)).filter(Boolean) as Work[]);
      const rows = await Promise.all(hist.map(async (p) => {
        const work = all.find((w) => w.id === p.work_id);
        let chapterLabel = 'ตอนที่อ่าน';
        try {
          const c = await api.getChapter(p.chapter_id);
          chapterLabel = `ตอนที่ ${c.number} · ${c.title}`;
        } catch { /* keep fallback */ }
        return { progress: p, work, chapterLabel };
      }));
      setHistory(rows);
    })().catch(() => undefined);
  }, [user, nav]);

  return (
    <div className="library-page">
      <div className="page-head">
        <h1>ชั้นหนังสือ</h1>
      </div>
      <div className="seg">
        <button type="button" className={tab === 'followed' ? 'on' : undefined} onClick={() => setSp({})}>ติดตาม</button>
        <button type="button" className={tab === 'history' ? 'on' : undefined} onClick={() => setSp({ tab: 'history' })}>ประวัติ</button>
      </div>
      {tab === 'followed' && (
        followed.length === 0 ? (
          <div className="pad center muted">
            <p>ยังไม่ได้ติดตามเรื่อง</p>
            <Link to="/discover" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>ไปค้นพบ</Link>
          </div>
        ) : (
          <div className="card-grid">
            {followed.map((w) => <SeriesCard key={w.id} work={w} />)}
          </div>
        )
      )}
      {tab === 'history' && (
        history.length === 0 ? (
          <p className="pad muted">ยังไม่มีประวัติการอ่าน</p>
        ) : (
          <div className="stack pad-x">
            {history.map((row) => row.work && (
              <Link key={row.progress.work_id} to={`/works/${row.work.slug}`} className="card history-row">
                <div>
                  <strong>{row.work.title}</strong>
                  <div className="muted" style={{ fontSize: 13 }}>{row.chapterLabel}</div>
                </div>
                <span className="muted">{relativeTime(row.progress.updated_at)}</span>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
