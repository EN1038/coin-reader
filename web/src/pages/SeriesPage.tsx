import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, Work } from '../lib/types';
import { ApiError } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';
import { Cover } from '../components/CoverCard';
import { CoverBadges } from '../components/SeriesCard';
import { UnlockSheet } from '../components/UnlockSheet';
import { episodeState, isFreeEpisode } from '../lib/access';
import { formatCount, kindLabel, relativeTime, statusLabel } from '../lib/format';

const TIP_AMOUNTS = [5, 10, 20, 50];

export function SeriesPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, setBalance, tickets, setTickets, refresh } = useApp();
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [purchased, setPurchased] = useState<Record<string, boolean>>({});
  const [inShelf, setInShelf] = useState(false);
  const [sheet, setSheet] = useState<{ chapter?: Chapter; work?: boolean; insufficient?: boolean } | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [mine, setMine] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function load(nextSlug: string) {
    const w = await api.getWorkBySlug(nextSlug);
    setWork(w);
    const chs = await api.listChapters(w.id);
    setChapters(chs);
    const shelf = user ? await api.inBookshelf(w.id) : false;
    setInShelf(shelf);
    const map: Record<string, boolean> = {};
    await Promise.all(chs.map(async (c) => {
      const readable = await api.isChapterUnlocked(c.id);
      const followOpen = !!c.follow_free && shelf;
      map[c.id] = readable && !isFreeEpisode(w, c) && !followOpen;
    }));
    setPurchased(map);
    setMine(await api.myRating(w.id));
  }

  useEffect(() => {
    if (!slug) return;
    load(slug).catch(() => setError('ไม่พบเรื่อง'));
  }, [slug, user]);

  function readPath(c: Chapter) {
    if (!work) return '/';
    return work.kind === 'manga' ? `/read/manga/${work.id}/${c.id}` : `/read/novel/${work.id}/${c.id}`;
  }

  function openChapter(c: Chapter) {
    if (!work) return;
    const state = episodeState(work, c, { unlocked: purchased[c.id], following: inShelf });
    if (state === 'free' || state === 'unlocked') {
      nav(readPath(c));
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
        setPurchased(map);
        setSheet(null);
      } else if (sheet.chapter) {
        const c = sheet.chapter;
        try {
          const r = await api.unlockChapter({ chapter_id: c.id, expected_price: c.coin_price });
          setBalance(r.balance);
          setPurchased((m) => ({ ...m, [c.id]: true }));
          setSheet(null);
          nav(readPath(c));
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

  async function useTicket() {
    if (!sheet?.chapter || !work) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.unlockWithTicket(sheet.chapter.id);
      setBalance(r.balance);
      setTickets(await api.ticketBalance());
      setPurchased((m) => ({ ...m, [sheet.chapter!.id]: true }));
      const id = sheet.chapter.id;
      setSheet(null);
      nav(readPath(chapters.find((c) => c.id === id) ?? sheet.chapter));
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleShelf() {
    if (!work) return;
    if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
    const on = await api.toggleBookshelf(work.id);
    setInShelf(on);
    setNote(on ? 'ติดตามแล้ว — ตอนที่ตั้งให้อ่านฟรีเมื่อติดตามเปิดให้แล้ว' : 'เลิกติดตามแล้ว');
  }

  async function rate(stars: number) {
    if (!work) return;
    if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
    const r = await api.rateWork(work.id, stars);
    setMine(r.mine);
    setWork({ ...work, score: r.score, rating_count: r.rating_count });
  }

  async function sendTip() {
    if (!work) return;
    if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api.tipWriter(work.id, tipAmount);
      setBalance(r.balance);
      setTipOpen(false);
      setNote(`สนับสนุน ${work.author_name} ${tipAmount} เหรียญแล้ว · เหรียญคืนไม่ได้`);
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INSUFFICIENT_COINS') {
        setError('เหรียญไม่พอสำหรับสนับสนุน');
      } else setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !work) {
    return <div className="pad center"><p>{error}</p><Link to="/">กลับหน้าแรก</Link></div>;
  }
  if (!work) return <div className="pad muted">กำลังโหลด…</div>;

  const continueChapter = [...chapters].reverse().find((c) => episodeState(work, c, { unlocked: purchased[c.id], following: inShelf }) !== 'locked' && episodeState(work, c, { unlocked: purchased[c.id], following: inShelf }) !== 'follow') ?? chapters[0];
  const price = sheet?.work ? (work.price_full_work ?? 0) : (sheet?.chapter?.coin_price ?? 0);

  return (
    <div className="series-page">
      <div className="series-layout">
        <aside className="series-info">
          <div className="series-cover-lg">
            <Cover work={work} tag={<CoverBadges work={work} />} />
          </div>
          <h1>{work.title}</h1>
          <Link to={`/authors/${work.author_id}`} className="author-link">{work.author_name}</Link>
          <div className="series-pills">
            <span>{kindLabel(work.kind)}</span>
            <span>{work.category}</span>
            <span>{statusLabel(work.status)}</span>
            <span>{work.chapter_count} ตอน</span>
            {work.rating === '18+' && <span>18+ เดโม ไม่ได้ตรวจอายุ</span>}
          </div>
          <div className="series-stats">
            <span>👁 {formatCount(work.views)}</span>
            <span>★ {work.score.toFixed(1)} ({work.rating_count.toLocaleString('th-TH')})</span>
            <span>ฟรี {work.free_episode_count} ตอนแรก</span>
          </div>
          <div className="star-row" role="group" aria-label="ให้คะแนนเรื่อง">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={mine != null && n <= mine ? 'on' : undefined} onClick={() => rate(n)} aria-label={`${n} ดาว`}>
                ★
              </button>
            ))}
            <span className="muted">{mine ? `คุณให้ ${mine}` : 'ให้คะแนน'}</span>
          </div>
          <p className="synopsis">{work.synopsis}</p>
          <div className="series-actions">
            {continueChapter && (
              <button type="button" className="btn btn-primary" onClick={() => openChapter(continueChapter)}>อ่านต่อ</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={toggleShelf}>{inShelf ? 'กำลังติดตาม' : 'ติดตาม'}</button>
            <button type="button" className="btn btn-coin" onClick={() => setTipOpen(true)}>สนับสนุน</button>
          </div>
          {work.price_full_work != null && (
            <button type="button" className="series-buy" onClick={() => {
              if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
              setSheet({ work: true });
            }}>
              <span>ซื้อทั้งเรื่อง</span>
              <strong>🪙 {work.price_full_work}</strong>
            </button>
          )}
          {note && <p className="ok-note">{note}</p>}
          {error && <p className="form-error">{error}</p>}
        </aside>

        <section className="episode-panel">
          <div className="sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2>ตอนทั้งหมด ({chapters.length})</h2>
            <span className="muted">ราคาต่อตอนตั้งโดยนักเขียน</span>
          </div>
          <div className="ep-list">
            {chapters.map((c) => {
              const state = episodeState(work, c, { unlocked: purchased[c.id], following: inShelf });
              return (
                <button key={c.id} type="button" className={`episode ${state}`} onClick={() => openChapter(c)}>
                  <span className="ep-main">
                    <span className="ep-no">ตอนที่ {c.number}</span>
                    <span className="ep-title">{c.title}</span>
                    <span className="ep-time">{relativeTime(c.published_at)}</span>
                  </span>
                  <span className="ep-state">
                    {state === 'free' && 'ฟรี'}
                    {state === 'unlocked' && (c.follow_free && !purchased[c.id] ? 'อ่านฟรีเพราะติดตาม' : 'ปลดแล้ว')}
                    {state === 'follow' && (
                      <span>ติดตามเพื่ออ่านฟรี<br />หรือ 🪙 {c.coin_price}</span>
                    )}
                    {state === 'locked' && <span>🪙 {c.coin_price}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {sheet && (
        <UnlockSheet
          title={sheet.work ? `ทั้งเรื่อง · ${work.title}` : `ตอนที่ ${sheet.chapter?.number} — ${sheet.chapter?.title}`}
          price={price}
          busy={busy}
          mode={sheet.insufficient ? 'insufficient' : sheet.work ? 'work' : 'chapter'}
          tickets={tickets}
          onUseTicket={sheet.chapter ? useTicket : undefined}
          onConfirm={confirmUnlock}
          onClose={() => setSheet(null)}
        />
      )}

      {tipOpen && (
        <div className="sheet-bg" onClick={() => setTipOpen(false)} role="presentation">
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="handle" />
            <h2 style={{ fontSize: 18 }}>สนับสนุน {work.author_name}</h2>
            <p className="muted" style={{ fontSize: 13, margin: '8px 0 14px' }}>
              ใช้เหรียญในบัญชี · คืนไม่ได้ โอนไม่ได้ ส่วนที่นักเขียนได้หักค่าธรรมเนียมแพลตฟอร์มซึ่งยังเป็น placeholder
            </p>
            <div className="tip-grid">
              {TIP_AMOUNTS.map((n) => (
                <button key={n} type="button" className={tipAmount === n ? 'on' : undefined} onClick={() => setTipAmount(n)}>
                  🪙 {n}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-coin btn-block" disabled={busy} onClick={sendTip}>
              {busy ? 'กำลังส่ง…' : `ส่ง ${tipAmount} เหรียญ`}
            </button>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setTipOpen(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}
