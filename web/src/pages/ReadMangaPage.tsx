import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Chapter, Work, MangaPageUrl } from '../lib/types';
import { Badge } from '../components/Badge';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export function ReadMangaPage() {
  const { workId, chapterId } = useParams();
  const nav = useNavigate();
  const { user } = useApp();
  const { theme } = useTheme();
  const readerClass = theme === 'dark' ? 'theme-reader-dark' : 'theme-reader-light';
  const [work, setWork] = useState<Work | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<MangaPageUrl[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workId || !chapterId) return;
    (async () => {
      try {
        const w = await api.getWork(workId);
        const c = await api.getChapter(chapterId);
        const unlocked = await api.isChapterUnlocked(chapterId);
        if (!unlocked && c.pricing === 'coin') throw new Error('locked');
        const urls: MangaPageUrl[] = [];
        for (let i = 1; i <= 3; i++) {
          urls.push(await api.getMangaPageUrl(chapterId, i));
        }
        setWork(w);
        setChapter(c);
        setPages(urls);
        if (user) await api.saveProgress(workId, chapterId, 0.1);
      } catch {
        setError('อ่านไม่ได้ — ต้องปลดล็อกหรือเข้าสู่ระบบ · หน้ามังงะใช้ signed URL เท่านั้น');
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
    return <div className={`${readerClass} reader-shell`} style={{ padding: 24, color: 'var(--text-muted)' }}>กำลังโหลดหน้า…</div>;
  }

  return (
    <div className={`${readerClass} reader-shell`}>
      <div className="reader-top">
        <button type="button" className="icon-btn" aria-label="ย้อนกลับ" onClick={() => nav(`/works/${work.slug}`)}>←</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          {work.title} · ตอนที่ {chapter.number}
        </div>
        <span style={{ width: 40 }} />
      </div>
      <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge kind="ex">หน้ามังงะตัวอย่าง</Badge>
        <span>เลื่อนลงเพื่ออ่าน · URL อายุ ~{pages[0]?.expires_in ?? 120}s</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 80 }}>
        {pages.map((pg) => (
          <img
            key={pg.page_number}
            src={pg.url}
            alt={`หน้า ${pg.page_number}`}
            style={{ width: '100%', display: 'block', background: 'var(--surface)' }}
          />
        ))}
      </div>
      <div style={{ position: 'sticky', bottom: 0, padding: '12px 16px 20px', background: 'linear-gradient(transparent, var(--bg))', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-head)' }}>
        ↕ เลื่อนแนวตั้ง · signed URL ผ่าน get-manga-page-url
      </div>
    </div>
  );
}
