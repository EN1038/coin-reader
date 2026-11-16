import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { ReaderComment } from '../lib/types';
import { useApp, errMessage } from '../context/AppContext';
import { relativeTime } from '../lib/format';

export function CommentThread({ chapterId }: { chapterId: string }) {
  const { user } = useApp();
  const nav = useNavigate();
  const [rows, setRows] = useState<ReaderComment[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listComments(chapterId).then(setRows).catch(() => setRows([]));
  }, [chapterId, user]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      nav(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const row = await api.addComment(chapterId, text);
      setRows((list) => [row, ...list]);
      setText('');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function like(id: string) {
    if (!user) {
      nav(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      const next = await api.toggleCommentLike(id);
      setRows((list) => list.map((r) => (r.id === id ? next : r)));
    } catch (err) {
      setError(errMessage(err));
    }
  }

  return (
    <section className="comment-block">
      <h2>ความคิดเห็น ({rows.length})</h2>
      <form onSubmit={send} className="comment-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? 'เขียนความเห็นเกี่ยวกับตอนนี้' : 'เข้าสู่ระบบเพื่อคอมเมนต์'}
          rows={3}
          maxLength={1000}
          aria-label="ความเห็น"
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
          {busy ? 'กำลังส่ง…' : 'ส่งความเห็น'}
        </button>
      </form>
      <div className="comment-list">
        {rows.length === 0 && <p className="muted">ยังไม่มีความเห็น</p>}
        {rows.map((c) => (
          <article key={c.id} className="comment-item">
            <div className="comment-avatar" aria-hidden>{c.display_name.slice(0, 1)}</div>
            <div>
              <div className="comment-meta">
                <strong>{c.display_name}</strong>
                <span>{relativeTime(c.created_at)}</span>
              </div>
              <p>{c.body}</p>
              <button type="button" className={c.liked_by_me ? 'like-btn on' : 'like-btn'} onClick={() => like(c.id)}>
                ♥ {c.like_count}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
