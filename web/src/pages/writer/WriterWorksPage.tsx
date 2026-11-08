import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';
import { useMemo, useState } from 'react';

export function WriterWorksPage() {
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const [tick, setTick] = useState(0);
  const works = useMemo(() => (author ? mockDb.listWriterWorks(author.id) : []), [author, tick]);
  if (gate) return gate;

  return (
    <>
      <div className="row-between mb-3" style={{ alignItems: 'center' }}>
        <h1 style={{ fontSize: 20 }}>ผลงานของฉัน</h1>
        <Link to="/writer/works/new" className="btn btn-primary" style={{ minHeight: 40 }}>สร้างเรื่อง</Link>
      </div>
      {works.length === 0 ? (
        <div className="card muted">ยังไม่มีผลงาน — กดสร้างเรื่องเพื่อเริ่ม (mock)</div>
      ) : (
        <div className="stack">
          {works.map((w) => {
            const chs = mockDb.listWriterChapters(w.id);
            return (
              <div key={w.id} className="card">
                <div className="row-between" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{w.title}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {w.kind === 'manga' ? 'มังงะ' : 'นิยาย'} · {w.category} · {chs.length} ตอน · ฟรี {w.free_episode_count ?? 0} ตอนแรก · {w.status}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge kind="ex">ตัวอย่าง</Badge>
                      <Badge kind={w.status === 'published' ? 'ok' : w.status === 'takedown' ? 'danger' : 'note'}>{w.status}</Badge>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Link className="btn btn-ghost" style={{ minHeight: 36 }} to={`/writer/works/${w.id}/edit`}>แก้ไขเรื่อง</Link>
                    <Link className="btn btn-primary" style={{ minHeight: 36 }} to={`/writer/works/${w.id}/chapters/new`}>เพิ่มตอน</Link>
                  </div>
                </div>
                {chs.length > 0 && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    {chs.map((c) => (
                      <div key={c.id} className="row-between" style={{ padding: '6px 0', fontSize: 13 }}>
                        <span>ตอน {c.number}. {c.title} · {c.number <= (w.free_episode_count ?? 0) || c.pricing === 'free' ? 'ฟรี' : `🪙 ${c.coin_price}`}{c.follow_free ? ' · ติดตามอ่านฟรี' : ''}</span>
                        <Link to={`/writer/works/${w.id}/chapters/${c.id}/edit`} style={{ color: 'var(--primary)', fontWeight: 600 }}>แก้</Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button type="button" className="btn btn-ghost mt-3" onClick={() => setTick((n) => n + 1)} style={{ display: 'none' }} aria-hidden>refresh</button>
    </>
  );
}
