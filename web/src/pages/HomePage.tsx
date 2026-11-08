import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { SeriesUpdate, Work } from '../lib/types';
import { SeriesCard, UpdateCard } from '../components/SeriesCard';
import { Cover } from '../components/CoverCard';
import { GENRES } from '../lib/mock/seed';
import { formatCount, kindLabel, relativeTime } from '../lib/format';
import { useApp } from '../context/AppContext';

export function HomePage() {
  const { user } = useApp();
  const [works, setWorks] = useState<Work[]>([]);
  const [updates, setUpdates] = useState<SeriesUpdate[]>([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    Promise.all([api.listWorks(), api.listRecentUpdates(8)]).then(([all, recent]) => {
      setWorks(all);
      setUpdates(recent);
    }).catch(() => undefined);
  }, []);

  const banners = works.filter((w) => w.featured).slice(0, 3);
  const ranking = [...works].sort((a, b) => b.rank_daily - a.rank_daily).slice(0, 5);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const t = window.setInterval(() => setSlide((n) => (n + 1) % banners.length), 5000);
    return () => window.clearInterval(t);
  }, [banners.length]);

  const hero = banners[slide] ?? banners[0];

  return (
    <div className="home">
      {hero && (
        <section className="hero" aria-roledescription="carousel" aria-label="เรื่องเด่น">
          <Link to={`/works/${hero.slug}`} className={`hero-slide tone-${hero.cover_tone}`}>
            <div className="hero-copy">
              <div className="hero-kicker">{hero.is_new ? 'มาใหม่' : 'เรื่องเด่น'} · {kindLabel(hero.kind)}</div>
              <h1>{hero.title}</h1>
              <p>{hero.synopsis}</p>
              <div className="hero-meta">
                <span>★ {hero.score.toFixed(1)}</span>
                <span>👁 {formatCount(hero.views)}</span>
                <span>{hero.author_name}</span>
              </div>
              <span className="btn btn-coin btn-sm">อ่านเลย</span>
            </div>
            <div className="hero-cover"><Cover work={hero} /></div>
          </Link>
          <div className="hero-dots">
            {banners.map((b, i) => (
              <button key={b.id} type="button" className={i === slide ? 'on' : undefined} aria-label={b.title} onClick={() => setSlide(i)} />
            ))}
          </div>
        </section>
      )}

      <div className="promo-row">
        <Link to="/check-in" className="promo-card checkin">
          <span className="promo-ic" aria-hidden>📅</span>
          <span>
            <strong>เช็คอินรายวัน</strong>
            <small>รับเหรียญและตั๋วอ่านฟรี · รางวัลใหญ่ท้ายเดือน</small>
          </span>
        </Link>
        <Link to="/referral" className="promo-card refer">
          <span className="promo-ic" aria-hidden>🎁</span>
          <span>
            <strong>ชวนเพื่อน รับเหรียญ 7%</strong>
            <small>จากยอดเติมที่เพื่อนจ่าย ไม่รวมโบนัส · ถอนเป็นเงินไม่ได้</small>
          </span>
        </Link>
      </div>

      <section>
        <div className="sec">
          <h2>อัปเดตล่าสุด</h2>
          <Link to="/discover?sort=updated">ดูทั้งหมด</Link>
        </div>
        <div className="rail update-rail">
          {updates.map((u) => (
            <UpdateCard
              key={u.work.id}
              work={u.work}
              episodes={u.episodes.map((ep) => ({ ...ep, when: relativeTime(ep.published_at) }))}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="sec">
          <h2>อันดับยอดนิยมวันนี้</h2>
          <Link to="/ranking">ดูอันดับ</Link>
        </div>
        <ol className="rank-preview">
          {ranking.map((w, i) => (
            <li key={w.id}>
              <Link to={`/works/${w.slug}`}>
                <span className={`rank-no ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
                <span className="rank-cover"><Cover work={w} /></span>
                <span className="rank-copy">
                  <strong>{w.title}</strong>
                  <small>{w.author_name} · {w.category} · ★ {w.score.toFixed(1)}</small>
                </span>
                <span className="rank-views">👁 {formatCount(w.views)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {GENRES.map((genre) => {
        const novels = works.filter((w) => w.category === genre && w.kind === 'novel');
        const manga = works.filter((w) => w.category === genre && w.kind === 'manga');
        if (!novels.length && !manga.length) return null;
        return (
          <section key={genre}>
            {novels.length > 0 && (
              <>
                <div className="sec">
                  <h2>{genre} · นิยาย</h2>
                  <Link to={`/discover?kind=novel&category=${encodeURIComponent(genre)}`}>ดูทั้งหมด</Link>
                </div>
                <div className="rail card-rail">
                  {novels.map((w) => <SeriesCard key={w.id} work={w} />)}
                </div>
              </>
            )}
            {manga.length > 0 && (
              <>
                <div className="sec">
                  <h2>{genre} · มังงะ</h2>
                  <Link to={`/discover?kind=manga&category=${encodeURIComponent(genre)}`}>ดูทั้งหมด</Link>
                </div>
                <div className="rail card-rail">
                  {manga.map((w) => <SeriesCard key={w.id} work={w} />)}
                </div>
              </>
            )}
          </section>
        );
      })}

      {!user && (
        <div className="pad">
          <div className="card row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong>บัญชีตัวอย่าง</strong>
              <div className="muted" style={{ fontSize: 13 }}>demo@example.com · writer@example.com · รหัส demo1234</div>
            </div>
            <Link to="/auth/login" className="btn btn-primary btn-sm">เข้าสู่ระบบ</Link>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <p>Twilight Blue · เหรียญเป็นตัวอย่าง mock คืนไม่ได้ โอนไม่ได้ และหายเมื่อปิดบัญชี</p>
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
