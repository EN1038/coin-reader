import { Link } from 'react-router-dom';
import type { Work } from '../lib/types';
import { Cover } from './CoverCard';
import { formatCount, kindLabel } from '../lib/format';

export function CoverBadges({ work }: { work: Work }) {
  return (
    <span className="cover-badges">
      {work.status === 'completed' && <span className="mini-badge done">จบ</span>}
      {work.is_new && <span className="mini-badge fresh">ใหม่</span>}
      {work.rating === '18+' && <span className="mini-badge age">18+</span>}
    </span>
  );
}

export function SeriesCard({ work }: { work: Work }) {
  return (
    <Link to={`/works/${work.slug}`} className="series-card">
      <div className="series-cover-wrap">
        <Cover work={work} tag={<CoverBadges work={work} />} />
      </div>
      <div className="series-card-title">{work.title}</div>
      <div className="series-card-stat">
        <span>★ {work.score.toFixed(1)}</span>
        <span>👁 {formatCount(work.views)}</span>
      </div>
      <div className="series-card-sub">
        {work.chapter_count} ตอน · {work.category}
      </div>
      <div className="series-card-by">{work.author_name} · {kindLabel(work.kind)}</div>
    </Link>
  );
}

export function UpdateCard({
  work, episodes,
}: {
  work: Work;
  episodes: { id: string; number: number; title: string; published_at: string; when: string }[];
}) {
  return (
    <Link to={`/works/${work.slug}`} className="update-card">
      <div className="update-cover">
        <Cover work={work} tag={<CoverBadges work={work} />} />
      </div>
      <div className="update-body">
        <div className="update-title">{work.title}</div>
        <div className="update-by">{work.author_name} · {kindLabel(work.kind)}</div>
        {episodes.map((ep) => (
          <div key={ep.id} className="update-ep">
            <span>ตอนที่ {ep.number}</span>
            <span>{ep.when}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}
