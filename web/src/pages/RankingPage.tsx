import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Work } from '../lib/types';
import { Cover } from '../components/CoverCard';
import { CoverBadges } from '../components/SeriesCard';
import { formatCount, kindLabel } from '../lib/format';

const TABS = [
  { id: 'daily', label: 'รายวัน' },
  { id: 'weekly', label: 'รายสัปดาห์' },
  { id: 'monthly', label: 'รายเดือน' },
] as const;

export function RankingPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('daily');
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    api.listWorks({ sort: tab }).then(setWorks).catch(() => setWorks([]));
  }, [tab]);

  return (
    <div className="ranking-page">
      <div className="page-head">
        <h1>อันดับ</h1>
        <p className="muted">จัดจากยอดตัวอย่างในชุดข้อมูล mock แยกช่วงวัน สัปดาห์ และเดือน</p>
      </div>
      <div className="seg" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <ol className="rank-list">
        {works.map((w, i) => (
          <li key={w.id}>
            <Link to={`/works/${w.slug}`}>
              <span className={`rank-no ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
              <span className="rank-cover"><Cover work={w} tag={<CoverBadges work={w} />} /></span>
              <span className="rank-copy">
                <strong>{w.title}</strong>
                <small>{w.author_name} · {kindLabel(w.kind)} · {w.category}</small>
                <small>★ {w.score.toFixed(1)} · {w.chapter_count} ตอน · {w.status === 'completed' ? 'จบ' : 'กำลังดำเนินเรื่อง'}</small>
              </span>
              <span className="rank-views">👁 {formatCount(w.views)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
