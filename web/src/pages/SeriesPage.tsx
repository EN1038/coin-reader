import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, Work } from '../lib/types';
import { ApiError } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';
import { Cover } from '../components/CoverCard';
import { Badge } from '../components/Badge';
import { UnlockSheet } from '../components/UnlockSheet';

export function SeriesPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, setBalance, refresh } = useApp();
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [inShelf, setInShelf] = useState(false);
  const [tab, setTab] = useState<'toc' | 'about'>('toc');
  const [sheet, setSheet] = useState<{ chapter?: Chapter; work?: boolean; insufficient?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const w = await api.getWorkBySlug(slug);
      setWork(w);
      const chs = await api.listChapters(w.id);
      setChapters(chs);
      const map: Record<string, boolean> = {};
      await Promise.all(chs.map(async (c) => { map[c.id] = await api.isChapterUnlocked(c.id); }));
      setUnlocked(map);
      if (user) setInShelf(await api.inBookshelf(w.id));
    })().catch(() => setError('ไม่พบเรื่อง'));
  }, [slug, user]);

  async function openChapter(c: Chapter) {
    if (!work) return;
    if (c.pricing === 'free' || unlocked[c.id]) {
      const path = work.kind === 'manga'
        ? `/read/manga/${work.id}/${c.id}`
        : `/read/novel/${work.id}/${c.id}`;
      nav(path);
      return;
    }
    if (!user) {
      nav(`/auth/login?next=/works/${work.slug}`);
      return;
    }
    setSheet({ chapter: c });
  }

  async function confirmUnlock() {
    if (!work || !sheet) return;
    setBusy(true);
    setError('');
    try {
      if (sheet.work && work.price_full_work != null) {
        const r = await api.unlockChapter({ work_id: work.id, expected_price: work.price_full_work });
        setBalance(r.balance);
        const map: Record<string, boolean> = {};
        chapters.forEach((c) => { map[c.id] = true; });
        setUnlocked(map);
        setSheet(null);
      } else if (sheet.chapter) {
        const c = sheet.chapter;
        try {
          const r = await api.unlockChapter({ chapter_id: c.id, expected_price: c.coin_price });
          setBalance(r.balance);
          setUnlocked((m) => ({ ...m, [c.id]: true }));
          setSheet(null);
          const path = work.kind === 'manga'
            ? `/read/manga/${work.id}/${c.id}`
            : `/read/novel/${work.id}/${c.id}`;
          nav(path);
        } catch (e) {
          if (e instanceof ApiError && e.code === 'INSUFFICIENT_COINS') {
            setSheet({ chapter: c, insufficient: true });
            return;
          }
          throw e;
        }
      }
      await refresh();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleShelf() {
    if (!work) return;
    if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
    setInShelf(await api.toggleBookshelf(work.id));
  }

  if (error && !work) {
    return (
      <div className="pad center">
        <p>{error}</p>
        <Link to="/">กลับหน้าแรก</Link>
      </div>
    );
  }
  if (!work) return <div className="pad muted">กำลังโหลด…</div>;

  const lastReadable = [...chapters].reverse().find((c) => c.pricing === 'free' || unlocked[c.id]) ?? chapters[0];
  const price = sheet?.work ? (work.price_full_work ?? 0) : (sheet?.chapter?.coin_price ?? 0);
  const sheetTitle = sheet?.work
    ? `ทั้งเล่ม · ${work.title}`
    : sheet?.chapter
      ? `ตอนที่ ${sheet.chapter.number} — ${sheet.chapter.title}`
      : '';

  return (
    <>
      <div className="series-banner">
        <button type="button" className="icon-btn" style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.35)', color: '#fff', borderRadius: 999, border: 'none' }} onClick={() => nav(-1)}>←</button>
      </div>
      <div className="series-head">
        <div className="series-cover">
          <Cover work={work} />
        </div>
        <h1 style={{ fontSize: 22, margin: '12px 0 4px' }}>{work.title}</h1>
        <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          โดย{' '}
          <Link to={`/authors/${work.author_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
            {work.author_name}
          </Link>
          {' '}· {work.kind === 'manga' ? 'มังงะ' : 'นิยาย'} · {work.category}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge kind="ex">ข้อมูลตัวอย่าง</Badge>
          <Badge kind="note">เรตติ้ง {work.rating}</Badge>
          <Badge>{work.chapter_count} ตอน</Badge>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)', margin: '12px 0' }}>
          {work.synopsis}
        </p>
        <div className="series-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => lastReadable && openChapter(lastReadable)}
          >
            อ่านตอนล่าสุด
          </button>
          <button type="button" className="btn btn-ghost" style={{ width: 48, minWidth: 48, padding: 0 }} onClick={toggleShelf} aria-label="ชั้นหนังสือ">
            {inShelf ? '♥' : '♡'}
          </button>
        </div>
      </div>

      {work.price_full_work != null && (
        <div className="series-buy">
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14 }}>ซื้อทั้งเล่ม</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ตัวอย่างราคา · ประหยัดกว่าซื้อทีละตอน</div>
          </div>
          <button type="button" className="btn btn-coin btn-sm" onClick={() => {
            if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
            setSheet({ work: true });
          }}>
            🪙 {work.price_full_work}
          </button>
        </div>
      )}

      <div className="series-tabs">
        {(['toc', 'about'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'on' : undefined}
            onClick={() => setTab(t)}
          >
            {t === 'toc' ? 'สารบัญ' : 'เกี่ยวกับ'}
          </button>
        ))}
      </div>

      {tab === 'toc' && chapters.map((c) => (
        <button key={c.id} type="button" className="ep" onClick={() => openChapter(c)}>
          <div className="n">{c.number}</div>
          <div className="meta">
            <div className="t">ตอนที่ {c.number} — {c.title}</div>
            <div className="s">{unlocked[c.id] || c.pricing === 'free' ? 'อ่านได้' : 'ยังไม่ปลดล็อก'} · ตัวอย่าง</div>
          </div>
          {c.pricing === 'free' || unlocked[c.id]
            ? <Badge kind="free">{unlocked[c.id] && c.pricing === 'coin' ? 'ปลดแล้ว' : 'ฟรี'}</Badge>
            : <Badge kind="lock">🪙 {c.coin_price}</Badge>}
        </button>
      ))}

      {tab === 'about' && (
        <div className="pad">
          <p className="muted" style={{ lineHeight: 1.7 }}>{work.synopsis}</p>
          <div className="mt-3" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {work.tags.map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
          <p className="ex mt-3">เนื้อหาและราคาทั้งหมดเป็นตัวอย่าง (is_example_data)</p>
        </div>
      )}

      {error && <p className="center" style={{ color: 'var(--danger)', padding: 12 }}>{error}</p>}

      {sheet && (
        <UnlockSheet
          title={sheetTitle}
          price={price}
          mode={sheet.insufficient ? 'insufficient' : sheet.work ? 'work' : 'chapter'}
          busy={busy}
          onClose={() => setSheet(null)}
          onConfirm={confirmUnlock}
        />
      )}
    </>
  );
}
