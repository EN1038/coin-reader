import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { mockDb } from '../../lib/mock/store';

export function AdminWorksPage() {
  const [tick, setTick] = useState(0);
  const works = mockDb.getState().writerWorks;
  void tick;

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>เนื้อหา / ผลงาน</h1>
      <div className="stack">
        {works.map((w) => (
          <div key={w.id} className="card row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{w.title}</div>
              <div className="muted" style={{ fontSize: 12 }}>{w.kind} · {w.author_id} · {w.slug}</div>
            </div>
            <Badge kind={w.status === 'published' ? 'ok' : w.status === 'takedown' || w.status === 'suspended' ? 'danger' : 'note'}>{w.status}</Badge>
            <div style={{ display: 'flex', gap: 6 }}>
              {w.status !== 'suspended' && (
                <button type="button" className="btn btn-ghost" style={{ minHeight: 36 }} onClick={() => { mockDb.setWriterWorkStatus(w.id, 'suspended'); setTick((n) => n + 1); }}>ระงับ</button>
              )}
              {w.status === 'suspended' && (
                <button type="button" className="btn btn-primary" style={{ minHeight: 36 }} onClick={() => { mockDb.setWriterWorkStatus(w.id, 'published'); setTick((n) => n + 1); }}>ปลดระงับ</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
