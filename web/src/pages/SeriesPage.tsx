import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, ReaderComment, Work } from '../lib/types';
import { ApiError } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';
import { Cover } from '../components/CoverCard';
import { CoverBadges } from '../components/SeriesCard';
import { UnlockSheet } from '../components/UnlockSheet';
import { episodeState, isFreeEpisode } from '../lib/access';
import { formatCount, kindLabel, relativeTime, statusLabel } from '../lib/format';
import {
  IconChevronRight,
  IconEye,
  IconShelf,
  IconStar,
  IconThumbsUp,
} from '../components/icons';
import { CoinAmount } from '../components/CoinAmount';
import { MangaPosterCard } from './HomePage';

const TIP_AMOUNTS = [5, 10, 20, 50];
type DetailTab = 'details' | 'chapters' | 'reviews';

export function SeriesPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, setBalance, tickets, setTickets, refresh } = useApp();
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [related, setRelated] = useState<Work[]>([]);
  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [purchased, setPurchased] = useState<Record<string, boolean>>({});
  const [inShelf, setInShelf] = useState(false);
  const [tab, setTab] = useState<DetailTab>('details');
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
    setComments(await api.listWorkComments(w.id));
    const all = await api.listWorks({});
    const sameCat = all.filter((x) => x.id !== w.id && x.category === w.category);
    const others = all.filter((x) => x.id !== w.id && x.category !== w.category);
    setRelated([...sameCat, ...others].slice(0, 8));
  }

  useEffect(() => {
    if (!slug) return;
    load(slug).catch(() => setError('ไม่พบเรื่อง'));
  }, [slug, user]);

  const latestChapters = useMemo(
    () => [...chapters].sort((a, b) => b.number - a.number).slice(0, 5),
    [chapters],
  );

  const ratingBars = useMemo(() => {
    if (!work) return [];
    // Approximate histogram from overall score (API has no per-star counts)
    const s = Math.min(5, Math.max(1, work.score));
    const raw = [
      Math.max(0.4, s - 3.2),
      Math.max(0.15, 5.2 - Math.abs(s - 4.2) * 1.4),
      Math.max(0.04, 2.2 - Math.abs(s - 3) * 0.9),
      Math.max(0.01, 1.1 - Math.abs(s - 2) * 0.5),
      Math.max(0.01, 1.0 - Math.abs(s - 1) * 0.4),
    ];
    const sum = raw.reduce((a, b) => a + b, 0);
    let pcts = raw.map((w) => Math.round((w / sum) * 100));
    const drift = 100 - pcts.reduce((a, b) => a + b, 0);
    pcts[0] += drift;
    return [5, 4, 3, 2, 1].map((stars, i) => ({ stars, pct: Math.max(0, pcts[i]) }));
  }, [work]);

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
    setNote(on ? 'บันทึกแล้ว' : 'เอาออกจากคลังแล้ว');
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
      setNote(`สนับสนุน ${work.author_name} ${tipAmount} Gold แล้ว`);
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INSUFFICIENT_COINS') {
        setError('Gold ไม่พอสำหรับสนับสนุน');
      } else setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !work) {
    return <div className="pad center"><p>{error}</p><Link to="/">กลับหน้าแรก</Link></div>;
  }
  if (!work) return <div className="pad muted">กำลังโหลด…</div>;

  const latest = latestChapters[0] ?? chapters[chapters.length - 1];
  const continueChapter = [...chapters].reverse().find((c) => {
    const s = episodeState(work, c, { unlocked: purchased[c.id], following: inShelf });
    return s !== 'locked' && s !== 'follow';
  }) ?? chapters[0];
  const price = sheet?.work ? (work.price_full_work ?? 0) : (sheet?.chapter?.coin_price ?? 0);
  return (
    <div className="cm-detail">
      <nav className="cm-detail-bc" aria-label="เส้นทาง">
        <Link to="/">หน้าแรก</Link>
        <IconChevronRight size={14} />
        <Link to={`/discover?category=${encodeURIComponent(work.category)}`}>{work.category}</Link>
        <IconChevronRight size={14} />
        <span>{work.title}</span>
      </nav>

      <section className="cm-detail-hero">
        <div className="cm-detail-cover">
          <Cover work={work} tag={<CoverBadges work={work} />} />
        </div>

        <div className="cm-detail-main">
          <h1>{work.title}</h1>
          <p className="cm-detail-sub">
            {kindLabel(work.kind)} · โดย{' '}
            <Link to={`/authors/${work.author_id}`}>{work.author_name}</Link>
            <button
              type="button"
              className="cm-detail-tip-inline"
              onClick={() => setTipOpen(true)}
              aria-label={`สนับสนุน ${work.author_name}`}
            >
              <IconThumbsUp size={14} /> สนับสนุน
            </button>
          </p>

          <div className="cm-detail-scoreline meta-inline">
            <IconStar size={16} className="ic-star" />
            <strong>{work.score.toFixed(1)}</strong>
            <span className="muted">จาก {work.rating_count.toLocaleString('th-TH')} รีวิว</span>
            <span className="meta-inline muted"><IconEye size={14} /> {formatCount(work.views)}</span>
          </div>

          <div className="cm-detail-chips">
            <Link to={`/discover?category=${encodeURIComponent(work.category)}`} className="cm-detail-chip">
              {work.category}
            </Link>
            {work.tags.slice(0, 4).map((t) => (
              <Link key={t} to={`/discover?q=${encodeURIComponent(t)}`} className="cm-detail-chip">
                {t}
              </Link>
            ))}
          </div>

          <dl className="cm-detail-meta">
            <div><dt>ผู้แปล / นักเขียน</dt><dd><Link to={`/authors/${work.author_id}`}>{work.author_name}</Link></dd></div>
            <div><dt>สถานะ</dt><dd>{statusLabel(work.status)}</dd></div>
            <div><dt>จำนวนตอน</dt><dd>{work.chapter_count} ตอน · ฟรี {work.free_episode_count} ตอนแรก</dd></div>
            {work.rating === '18+' && <div><dt>เรตติ้ง</dt><dd>18+ (เดโม ไม่ได้ตรวจอายุ)</dd></div>}
          </dl>

          <div className="cm-detail-actions">
            {latest && (
              <button type="button" className="btn btn-primary" onClick={() => openChapter(latest)}>
                อ่านล่าสุด{latest ? ` (ตอน ${latest.number})` : ''}
              </button>
            )}
            {continueChapter && continueChapter.id !== latest?.id && (
              <button type="button" className="btn btn-ghost" onClick={() => openChapter(continueChapter)}>
                อ่านต่อ
              </button>
            )}
            <button type="button" className={`btn btn-ghost cm-detail-icon-btn${inShelf ? ' on' : ''}`} onClick={toggleShelf}>
              <IconShelf size={18} />
              {inShelf ? 'บันทึกแล้ว' : 'บันทึก'}
            </button>
            {work.price_full_work != null && (
              <button
                type="button"
                className="btn btn-coin cm-detail-icon-btn"
                onClick={() => {
                  if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
                  setSheet({ work: true });
                }}
              >
                ซื้อทั้งเรื่อง · <CoinAmount value={work.price_full_work} currency="gold" size={14} />
              </button>
            )}
          </div>

          {note && <p className="ok-note">{note}</p>}
          {error && <p className="form-error">{error}</p>}
        </div>

        <aside className="cm-detail-rating-card" aria-label="คะแนนเฉลี่ย">
          <h2 className="cm-detail-rating-title">คะแนนเฉลี่ย</h2>
          <div className="cm-detail-rating-big">
            <strong>{work.score.toFixed(1)}</strong>
            <span>/ 5</span>
          </div>
          <div className="cm-detail-stars-row">
            <div className="cm-detail-stars meta-inline" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar key={i} size={16} className={i < Math.round(work.score) ? 'ic-star' : 'ic-star-off'} />
              ))}
            </div>
            <span className="cm-detail-review-count">
              {work.rating_count.toLocaleString('th-TH')} รีวิว
            </span>
          </div>
          <div className="cm-detail-bars">
            {ratingBars.map((row) => (
              <div key={row.stars} className="cm-detail-bar-row">
                <span className="cm-detail-bar-label">
                  {row.stars}<IconStar size={11} className="ic-star" />
                </span>
                <span className="cm-detail-bar" aria-hidden>
                  <span style={{ width: `${row.pct}%` }} />
                </span>
                <span className="cm-detail-bar-pct">{row.pct}%</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <div className="cm-detail-tabs" role="tablist" aria-label="ส่วนรายละเอียด">
        {(
          [
            ['details', 'รายละเอียด'],
            ['chapters', `ตอนทั้งหมด (${chapters.length})`],
            ['reviews', `รีวิว / คอมเมนต์ (${comments.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'on' : undefined}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="cm-detail-body">
          <article className="cm-detail-synopsis">
            <h2>เรื่องย่อ</h2>
            <p>{work.synopsis}</p>
          </article>
          <aside className="cm-detail-latest">
            <div className="cm-detail-latest-head">
              <h2>ตอนล่าสุด</h2>
              <button type="button" className="sec-more" onClick={() => setTab('chapters')}>
                ดูทั้งหมด<IconChevronRight size={16} className="sec-more-ic" />
              </button>
            </div>
            <ul>
              {latestChapters.map((c) => {
                const state = episodeState(work, c, { unlocked: purchased[c.id], following: inShelf });
                return (
                  <li key={c.id}>
                    <button type="button" className="cm-detail-latest-row" onClick={() => openChapter(c)}>
                      <span>
                        <strong>ตอนที่ {c.number}</strong>
                        <small>{c.title}</small>
                      </span>
                      <span className="cm-detail-latest-meta">
                        {c.number >= (latest?.number ?? 0) - 1 && <span className="mini-badge fresh">ใหม่</span>}
                        {state === 'free' && <span className="muted">ฟรี</span>}
                        {state === 'locked' && <CoinAmount value={c.coin_price} currency="gold" size={12} />}
                        {state === 'unlocked' && <span className="muted">ปลดแล้ว</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      )}

      {tab === 'chapters' && (
        <section className="cm-detail-chapters">
          <div className="cm-detail-chapters-head">
            <h2>ตอนทั้งหมด</h2>
            <span className="muted">ราคาต่อตอนตั้งโดยนักแปล · หน่วย Gold</span>
          </div>
          <div className="cm-detail-ep-list">
            {chapters.map((c) => {
              const state = episodeState(work, c, { unlocked: purchased[c.id], following: inShelf });
              return (
                <button key={c.id} type="button" className={`cm-detail-ep ${state}`} onClick={() => openChapter(c)}>
                  <span className="ep-main">
                    <span className="ep-no">ตอนที่ {c.number}</span>
                    <span className="ep-title">{c.title}</span>
                    <span className="ep-time">{relativeTime(c.published_at)}</span>
                  </span>
                  <span className="ep-state">
                    {state === 'free' && 'ฟรี'}
                    {state === 'unlocked' && (c.follow_free && !purchased[c.id] ? 'อ่านฟรีเพราะติดตาม' : 'ปลดแล้ว')}
                    {state === 'follow' && (
                      <span>ติดตามเพื่ออ่านฟรี<br />หรือ <CoinAmount value={c.coin_price} currency="gold" size={12} /></span>
                    )}
                    {state === 'locked' && <CoinAmount value={c.coin_price} currency="gold" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'reviews' && (
        <section className="cm-detail-reviews">
          <h2>ให้คะแนนเรื่องนี้</h2>
          <div className="star-row" role="group" aria-label="ให้คะแนนเรื่อง">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={mine != null && n <= mine ? 'on' : undefined} onClick={() => rate(n)} aria-label={`${n} ดาว`}>
                <IconStar size={22} />
              </button>
            ))}
            <span className="muted">{mine ? `คุณให้ ${mine} ดาว` : 'แตะเพื่อให้คะแนน'}</span>
          </div>

          <div className="comment-block" style={{ padding: '20px 0 0' }}>
            <h2>ความคิดเห็น</h2>
            {user ? (
              <form
                className="comment-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!work || !commentBody.trim()) return;
                  setBusy(true);
                  try {
                    const row = await api.addWorkComment(work.id, commentBody);
                    setComments((prev) => [row, ...prev]);
                    setCommentBody('');
                  } catch (err) {
                    setError(errMessage(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <textarea
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="แชร์ความคิดเห็นเกี่ยวกับเรื่องนี้…"
                  maxLength={1000}
                />
                <button type="submit" className="btn btn-primary" disabled={busy || !commentBody.trim()}>
                  {busy ? 'กำลังส่ง…' : 'โพสต์คอมเมนต์'}
                </button>
              </form>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>
                <Link to={`/auth/login?next=/works/${work.slug}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>เข้าสู่ระบบ</Link>
                {' '}เพื่อแสดงความคิดเห็น
              </p>
            )}
            <div className="comment-list">
              {comments.map((c) => (
                <div key={c.id} className="comment-item">
                  <div className="comment-avatar">{c.display_name.slice(0, 1)}</div>
                  <div>
                    <div className="comment-meta">
                      <strong>{c.display_name}</strong>
                      <span>{relativeTime(c.created_at)}</span>
                    </div>
                    <p>{c.body}</p>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ minHeight: 32, padding: '0 10px' }}
                      onClick={async () => {
                        if (!user) { nav(`/auth/login?next=/works/${work.slug}`); return; }
                        try {
                          const next = await api.toggleCommentLike(c.id);
                          setComments((prev) => prev.map((x) => (x.id === next.id ? next : x)));
                        } catch { /* ignore */ }
                      }}
                    >
                      <IconThumbsUp size={14} /> {c.like_count}
                    </button>
                  </div>
                </div>
              ))}
              {!comments.length && <p className="muted" style={{ fontSize: 13 }}>ยังไม่มีความคิดเห็น — เป็นคนแรกสิ</p>}
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="cm-detail-related">
          <div className="sec" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <h2>แนะนำเรื่องอื่น</h2>
            <Link to={`/discover?category=${encodeURIComponent(work.category)}`} className="sec-more">
              ดูเพิ่ม <IconChevronRight size={16} className="sec-more-ic" />
            </Link>
          </div>
          <div className="cm-grid cm-detail-related-grid">
            {related.map((w) => (
              <MangaPosterCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

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
              ใช้ Gold ในบัญชี · คืนไม่ได้ · นักแปลได้เป็น Diamond หลังหักค่าคอม
            </p>
            <div className="tip-grid">
              {TIP_AMOUNTS.map((n) => (
                <button key={n} type="button" className={tipAmount === n ? 'on' : undefined} onClick={() => setTipAmount(n)}>
                  <CoinAmount value={n} currency="gold" />
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-coin btn-block" disabled={busy} onClick={sendTip}>
              {busy ? 'กำลังส่ง…' : `ส่ง ${tipAmount} Gold`}
            </button>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setTipOpen(false)}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}
