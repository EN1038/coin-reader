import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, Work } from '../lib/types';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { CommentThread } from '../components/CommentThread';
import { ReaderAccessGate, type ReaderGateKind } from '../components/ReaderAccessGate';
import { isFreeEpisode, readPathFor } from '../lib/access';
import { useReadingProgress } from '../hooks/useReadingProgress';

export function ReadNovelPage() {
  const { workId, chapterId } = useParams();
  const nav = useNavigate();
  const { user } = useApp();
  const { theme } = useTheme();
  const readerClass = theme === 'dark' ? 'theme-reader-dark' : 'theme-reader-light';
  const [work, setWork] = useState<Work | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [body, setBody] = useState('');
  const [siblings, setSiblings] = useState<Chapter[]>([]);
  const [gate, setGate] = useState<ReaderGateKind | null>(null);
  const [loading, setLoading] = useState(true);

  useReadingProgress(workId, chapterId, !!user && !!body && !gate);

  useEffect(() => {
    if (!workId || !chapterId) return;
    let cancelled = false;
    setLoading(true);
    setGate(null);
    setBody('');
    (async () => {
      try {
        const w = await api.getWork(workId);
        const c = await api.getChapter(chapterId);
        if (cancelled) return;
        setWork(w);
        setChapter(c);

        const free = isFreeEpisode(w, c);
        const unlocked = await api.isChapterUnlocked(chapterId);
        if (cancelled) return;

        if (!unlocked) {
          if (!user) {
            setGate('need_login');
            return;
          }
          if (!free) {
            setGate('need_unlock');
            return;
          }
        }

        const [content, chs] = await Promise.all([
          api.getChapterContent(chapterId),
          api.listChapters(workId),
        ]);
        if (cancelled) return;
        setBody(content.body);
        setSiblings(chs);
      } catch {
        if (!cancelled) setGate('error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workId, chapterId, user]);

  if (gate) {
    return (
      <ReaderAccessGate
        kind={gate}
        work={work}
        chapter={chapter}
        readerClass={readerClass}
      />
    );
  }

  if (loading || !work || !chapter || !body) {
    return <div className={`${readerClass} reader-shell`} style={{ padding: 24, color: 'var(--text-muted)' }}>กำลังโหลด…</div>;
  }

  const idx = siblings.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const go = (c: Chapter) => nav(readPathFor(work, c.id));

  return (
    <div className={`${readerClass} reader-shell`}>
      <div className="reader-top">
        <button type="button" className="icon-btn" aria-label="ย้อนกลับ" onClick={() => nav(`/works/${work.slug}`)}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          ตอนที่ {chapter.number} · {chapter.title}
        </div>
        <span style={{ width: 40 }} />
      </div>
      <article className="reader-article">
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>ตอนที่ {chapter.number} — {chapter.title}</h1>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          {work.title} · {work.author_name} · <Badge kind="ex">ข้อความตัวอย่าง</Badge>
          {!user && isFreeEpisode(work, chapter) && (
            <span> · อ่านฟรีโดยไม่ต้องสมัคร</span>
          )}
        </div>
        {body.split(/\n\n+/).map((para, i) => (
          <p key={i} style={{ marginBottom: '1.1em' }}>{para}</p>
        ))}
      </article>
      {user && <CommentThread chapterId={chapter.id} />}
      <div className="reader-nav">
        <button type="button" className="btn" disabled={!prev} onClick={() => prev && go(prev)}>← ก่อนหน้า</button>
        <button type="button" className="btn" disabled={!next} onClick={() => next && go(next)}>ถัดไป →</button>
      </div>
    </div>
  );
}
