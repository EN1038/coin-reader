import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, Work } from '../lib/types';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workId || !chapterId) return;
    (async () => {
      try {
        const w = await api.getWork(workId);
        const c = await api.getChapter(chapterId);
        const content = await api.getChapterContent(chapterId);
        const chs = await api.listChapters(workId);
        setWork(w);
        setChapter(c);
        setBody(content.body);
        setSiblings(chs);
        if (user) await api.saveProgress(workId, chapterId, 0.1);
      } catch {
        setError('อ่านไม่ได้ — อาจยังไม่ได้ปลดล็อกหรือต้องเข้าสู่ระบบ');
      }
    })();
  }, [workId, chapterId, user]);

  if (error) {
    return (
      <div className={`${readerClass} reader-shell`} style={{ padding: 24 }}>
        <p>{error}</p>
        <Link to={work ? `/works/${work.slug}` : '/'} style={{ color: 'var(--accent-coin)' }}>กลับหน้าเรื่อง</Link>
      </div>
    );
  }
  if (!work || !chapter) {
    return <div className={`${readerClass} reader-shell`} style={{ padding: 24, color: 'var(--text-muted)' }}>กำลังโหลด…</div>;
  }

  const idx = siblings.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const go = (c: Chapter) => nav(`/read/novel/${work.id}/${c.id}`);

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
        </div>
        {body.split(/\n\n+/).map((para, i) => (
          <p key={i} style={{ marginBottom: '1.1em' }}>{para}</p>
        ))}
      </article>
      <div className="reader-nav">
        <button type="button" className="btn" disabled={!prev} onClick={() => prev && go(prev)}>← ก่อนหน้า</button>
        <button type="button" className="btn" disabled={!next} onClick={() => next && go(next)}>ถัดไป →</button>
      </div>
    </div>
  );
}
