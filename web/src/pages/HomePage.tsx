import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Category, ReadingProgress, SeriesUpdate, Work } from '../lib/types';
import { CoverBadges } from '../components/SeriesCard';
import { Cover } from '../components/CoverCard';
import { formatCount, relativeTime } from '../lib/format';
import { useApp } from '../context/AppContext';
import { BrandMascot } from '../components/BrandAssets';
import { BRAND_HERO, PRODUCT_NAME } from '../lib/brand';
import { CategoryIcon, IconEye, IconStar } from '../components/icons';

type RankPeriod = 'weekly' | 'monthly' | 'all';

type ContinueItem = {
  work: Work;
  chapterId: string;
  chapterNumber: number;
  progressPct: number;
};

export function HomePage() {
  const { user } = useApp();
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [updates, setUpdates] = useState<SeriesUpdate[]>([]);
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
  const [rankPeriod, setRankPeriod] = useState<RankPeriod>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.listWorks(), api.listRecentUpdates(8), api.listCategories(true)])
      .then(async ([all, recent, cats]) => {
        if (!alive) return;
        setWorks(all);
        setUpdates(recent);
        setCategories(cats);

        if (!user) {
          setContinueItems([]);
          return;
        }
        try {
          const history = await api.listHistory();
          const items = await buildContinue(all, history.slice(0, 5));
          if (alive) setContinueItems(items);
        } catch {
          if (alive) setContinueItems([]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  const recommended = useMemo(
    () => [...works].sort((a, b) => b.score - a.score || b.views - a.views).slice(0, 8),
    [works],
  );

  const ranking = useMemo(() => {
    const key = rankPeriod === 'weekly' ? 'rank_weekly' : rankPeriod === 'monthly' ? 'rank_monthly' : 'rank_daily';
    return [...works].sort((a, b) => b[key] - a[key]).slice(0, 5);
  }, [works, rankPeriod]);

  const latestGrid = useMemo(
    () => [...works].sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at)).slice(0, 8),
    [works],
  );

  return (
    <div className="home clean-home">
      <section className="cm-hero" aria-label="แบนเนอร์ Stock Manga">
        <Link to="/discover" className="cm-hero-banner" aria-label="เริ่มอ่านเลย">
          <img
            src={BRAND_HERO}
            alt="อ่านมังงะออนไลน์ อัปเดตตอนใหม่ทุกวัน — คลังมังงะคุณภาพ หลากหลายแนว อ่านได้ฟรี สะดวก ทุกอุปกรณ์"
            width={1600}
            height={520}
            decoding="async"
          />
        </Link>
      </section>

      <section className="cm-section" aria-label="หมวดหมู่ยอดนิยม">
        <div className="sec">
          <h2>หมวดหมู่ยอดนิยม</h2>
          <Link to="/discover">ดูทั้งหมด</Link>
        </div>
        <div className="cm-chips">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/discover?category=${encodeURIComponent(cat.name)}`}
              className="cm-chip"
            >
              <CategoryIcon name={cat.icon_key} size={15} className="cm-chip-ic" />
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="cm-layout">
        <div className="cm-main">
          <section className="cm-section">
            <div className="sec">
              <h2>การ์ตูนแนะนำวันนี้</h2>
              <Link to="/discover?sort=score">ดูทั้งหมด</Link>
            </div>
            {loading ? (
              <div className="cm-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="cm-skel" aria-hidden />
                ))}
              </div>
            ) : (
              <div className="cm-grid">
                {recommended.map((w) => (
                  <MangaPosterCard key={w.id} work={w} />
                ))}
              </div>
            )}
          </section>

          <section className="cm-section">
            <div className="sec">
              <h2>อัปเดตตอนล่าสุด</h2>
              <Link to="/discover?sort=updated">ดูทั้งหมด</Link>
            </div>
            <div className="cm-grid">
              {(updates.length ? updates.map((u) => u.work) : latestGrid).slice(0, 8).map((w) => (
                <MangaPosterCard key={`up-${w.id}`} work={w} showNew />
              ))}
            </div>
            {updates.length > 0 && (
              <div className="cm-update-list">
                {updates.slice(0, 4).map((u) => {
                  const ep = u.episodes[0];
                  return (
                    <Link key={u.work.id} to={`/works/${u.work.slug}`} className="cm-update-row">
                      <span className="cm-update-cover"><Cover work={u.work} /></span>
                      <span className="cm-update-copy">
                        <strong>{u.work.title}</strong>
                        <small>
                          {ep ? `ตอนที่ ${ep.number}` : `${u.work.chapter_count} ตอน`}
                          {ep ? ` · ${relativeTime(ep.published_at)}` : ''}
                        </small>
                      </span>
                      <span className="mini-badge fresh">ใหม่</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="cm-side">
          <section className="cm-panel">
            <div className="cm-panel-head">
              <h2>อันดับยอดนิยม</h2>
              <Link to="/ranking">ทั้งหมด</Link>
            </div>
            <div className="cm-rank-tabs" role="tablist" aria-label="ช่วงอันดับ">
              {(
                [
                  ['weekly', 'รายสัปดาห์'],
                  ['monthly', 'รายเดือน'],
                  ['all', 'ทั้งหมด'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={rankPeriod === key}
                  className={rankPeriod === key ? 'on' : undefined}
                  onClick={() => setRankPeriod(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <ol className="cm-rank-list">
              {ranking.map((w, i) => (
                <li key={w.id}>
                  <Link to={`/works/${w.slug}`}>
                    <span className={`cm-rank-no ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                    <span className="cm-rank-thumb"><Cover work={w} /></span>
                    <span className="cm-rank-copy">
                      <strong>{w.title}</strong>
                      <small className="meta-inline">
                        <IconStar size={12} className="ic-star" /> {w.score.toFixed(1)} · {w.chapter_count} ตอน
                      </small>
                      <small className="meta-inline">
                        <IconEye size={12} /> {formatCount(w.views)}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="cm-panel">
            <div className="cm-panel-head">
              <h2>อ่านต่อจากที่ค้างไว้</h2>
              {user && <Link to="/library?tab=history">ทั้งหมด</Link>}
            </div>
            {!user ? (
              <div className="cm-empty">
                <BrandMascot size="sm" />
                <p>เข้าสู่ระบบเพื่อบันทึกความคืบหน้า</p>
                <Link to="/auth/login" className="btn btn-primary btn-sm">เข้าสู่ระบบ</Link>
              </div>
            ) : continueItems.length === 0 ? (
              <div className="cm-empty">
                <BrandMascot size="sm" />
                <p>ยังไม่มีประวัติการอ่าน</p>
                <Link to="/discover" className="btn btn-ghost btn-sm">เริ่มเลือกเรื่อง</Link>
              </div>
            ) : (
              <ul className="cm-continue-list">
                {continueItems.map((item) => (
                  <li key={item.work.id}>
                    <Link
                      to={`/read/${item.work.kind}/${item.work.id}/${item.chapterId}`}
                      className="cm-continue-row"
                    >
                      <span className="cm-continue-cover"><Cover work={item.work} /></span>
                      <span className="cm-continue-copy">
                        <strong>{item.work.title}</strong>
                        <small>ตอนที่ {item.chapterNumber}</small>
                        <span className="cm-progress" aria-label={`ความคืบหน้า ${item.progressPct}%`}>
                          <span style={{ width: `${item.progressPct}%` }} />
                        </span>
                      </span>
                      <span className="btn btn-primary btn-sm">อ่านต่อ</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <footer className="site-footer">
        <BrandMascot size="sm" className="footer-mascot" />
        <p>{PRODUCT_NAME} · เหรียญเป็นตัวอย่าง mock คืนไม่ได้ โอนไม่ได้ และหายเมื่อปิดบัญชี</p>
        <div>
          <Link to="/help">ช่วยเหลือ</Link>
          <Link to="/legal/tos">ข้อกำหนด</Link>
          <Link to="/legal/privacy">ความเป็นส่วนตัว</Link>
          <Link to="/legal/coins">นโยบายเหรียญ</Link>
          <Link to="/legal/takedown">แจ้งละเมิด</Link>
          <Link to="/writer">เปิดรับนักเขียน</Link>
        </div>
      </footer>
    </div>
  );
}

function MangaPosterCard({ work, showNew }: { work: Work; showNew?: boolean }) {
  return (
    <Link to={`/works/${work.slug}`} className="cm-poster">
      <div className="cm-poster-cover">
        <Cover
          work={work}
          tag={(
            <CoverBadges work={showNew ? { ...work, is_new: true } : work} />
          )}
        />
      </div>
      <div className="cm-poster-title">{work.title}</div>
      <div className="cm-poster-meta">
        <span className="cm-star meta-inline"><IconStar size={12} className="ic-star" /> {work.score.toFixed(1)}</span>
        <span>{work.chapter_count} ตอน</span>
      </div>
    </Link>
  );
}

async function buildContinue(works: Work[], history: ReadingProgress[]): Promise<ContinueItem[]> {
  const byId = new Map(works.map((w) => [w.id, w]));
  const out: ContinueItem[] = [];
  for (const h of history) {
    const work = byId.get(h.work_id);
    if (!work) continue;
    try {
      const chapter = await api.getChapter(h.chapter_id);
      const pct = Math.max(4, Math.min(96, Math.round((h.position || 0.1) * 100)));
      out.push({
        work,
        chapterId: h.chapter_id,
        chapterNumber: chapter.number,
        progressPct: pct,
      });
    } catch {
      out.push({
        work,
        chapterId: h.chapter_id,
        chapterNumber: 1,
        progressPct: Math.max(4, Math.min(96, Math.round((h.position || 0.1) * 100))),
      });
    }
  }
  return out;
}
