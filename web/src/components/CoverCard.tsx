import { Link } from 'react-router-dom';
import type { Work } from '../lib/types';
import { Badge } from './Badge';

export function Cover({
  work, tag, className = '',
}: {
  work: Pick<Work, 'title' | 'cover_tone'>;
  tag?: React.ReactNode;
  className?: string;
}) {
  const tone = work.cover_tone === 'default' ? '' : work.cover_tone;
  return (
    <div className={`cover ${tone} ${className}`.trim()}>
      {tag && <span className="tag">{tag}</span>}
      <span className="cover-title">{work.title}</span>
    </div>
  );
}

export function CoverRailItem({ work, badge }: { work: Work; badge?: React.ReactNode }) {
  return (
    <Link to={`/works/${work.slug}`} className="item">
      <Cover work={work} tag={badge} />
      <div className="name">{work.title}</div>
      <div className="by">ตัวอย่าง · {work.kind === 'manga' ? 'มังงะ' : 'นิยาย'}</div>
    </Link>
  );
}

export function WorkListCard({ work }: { work: Work }) {
  return (
    <Link to={`/works/${work.slug}`} className="work-list-card">
      <div className="thumb">
        <Cover work={work} />
      </div>
      <div className="meta">
        <div className="t">{work.title}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {work.author_name} · {work.kind === 'manga' ? 'มังงะ' : 'นิยาย'} · {work.category}
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge kind="ex">ตัวอย่าง</Badge>
          <Badge>{work.chapter_count} ตอน</Badge>
        </div>
      </div>
    </Link>
  );
}
