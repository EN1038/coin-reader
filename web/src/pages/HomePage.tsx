import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Work } from '../lib/types';
import { Topbar } from '../components/Topbar';
import { Cover, CoverRailItem } from '../components/CoverCard';
import { Badge } from '../components/Badge';
import { PRODUCT_NAME } from '../lib/brand';

const CATS = ['ทั้งหมด', 'นิยาย', 'มังงะ', 'โรแมนติก', 'แฟนตาซี', 'สยองขวัญ'];

export function HomePage() {
  const [featured, setFeatured] = useState<Work | null>(null);
  const [popular, setPopular] = useState<Work[]>([]);
  const [mangaNew, setMangaNew] = useState<Work[]>([]);
  const [cat, setCat] = useState('ทั้งหมด');

  useEffect(() => {
    (async () => {
      const [f, pop, neu] = await Promise.all([
        api.listWorks({ featured: true }),
        api.listWorks({ popular: true }),
        api.listWorks({ kind: 'manga', isNew: true }),
      ]);
      setFeatured(f[0] ?? null);
      setPopular(pop);
      setMangaNew(neu.length ? neu : await api.listWorks({ kind: 'manga' }));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (cat === 'ทั้งหมด') {
        setPopular(await api.listWorks({ popular: true }));
        return;
      }
      if (cat === 'นิยาย') setPopular(await api.listWorks({ kind: 'novel' }));
      else if (cat === 'มังงะ') setPopular(await api.listWorks({ kind: 'manga' }));
      else setPopular(await api.listWorks({ category: cat }));
    })();
  }, [cat]);

  return (
    <>
      <div className="home-hero" style={{ background: 'linear-gradient(160deg,var(--hero-start),var(--hero-end))', color: 'var(--on-hero)', borderRadius: '0 0 20px 20px', paddingBottom: 16 }}>
        <Topbar
          title={PRODUCT_NAME}
          transparent
          showCoin
        />
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>มาใหม่สัปดาห์นี้</div>
          <h1 style={{ fontSize: 22, marginBottom: 12, color: 'var(--on-hero)' }}>เรื่องเด่นวันนี้</h1>
          {featured && (
            <Link to={`/works/${featured.slug}`} className="row" style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: 12, gap: 12 }}>
              <div style={{ width: 64, flexShrink: 0 }}>
                <Cover work={featured} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15 }}>{featured.title}</div>
                <div style={{ fontSize: 12, opacity: 0.75, margin: '4px 0' }}>โดย {featured.author_name} · {featured.category}</div>
                <Badge kind="ex">ตัวอย่าง</Badge>
              </div>
            </Link>
          )}
        </div>
      </div>

      <Link to="/search" className="searchbar">⌕ ค้นหาเรื่อง นักเขียน หมวด…</Link>

      <div className="chips">
        {CATS.map((c) => (
          <button key={c} type="button" className={cat === c ? 'on' : undefined} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="sec">
        <h2>ยอดนิยม</h2>
        <Link to="/search" className="link">ดูทั้งหมด</Link>
      </div>
      <div className="rail">
        {popular.map((w) => (
          <CoverRailItem
            key={w.id}
            work={w}
            badge={w.kind === 'novel' && w.id === 'w-ngj' ? <Badge kind="free">ฟรี</Badge> : undefined}
          />
        ))}
      </div>

      <div className="sec">
        <h2>มังงะมาใหม่</h2>
        <Link to="/search?kind=manga" className="link">ดูทั้งหมด</Link>
      </div>
      <div className="rail">
        {mangaNew.map((w) => (
          <CoverRailItem key={w.id} work={w} />
        ))}
      </div>
      <div style={{ height: 12 }} />
    </>
  );
}
