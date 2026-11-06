import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { useApp } from '../../context/AppContext';

export function WriterRegisterPage() {
  const { user } = useApp();
  const { author: ctxAuthor } = useOutletContext<{ author?: AuthorRecord }>();
  const author = ctxAuthor ?? (user ? mockDb.authorForUser(user.id) : undefined);
  const [name, setName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      mockDb.applyAuthor({ display_name: name, bio });
      setDone(true);
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_APPLIED') setError('มีใบสมัครอยู่แล้ว');
      else setError('ส่งไม่สำเร็จ');
    }
  }

  if (author && !done) {
    return (
      <div className="card" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>สถานะนักเขียน</h1>
        <p className="mb-2">{author.display_name}</p>
        <Badge kind={author.status === 'approved' ? 'ok' : author.status === 'pending' ? 'note' : 'danger'}>{author.status}</Badge>
        {author.bio && <p className="muted mt-3" style={{ fontSize: 14 }}>{author.bio}</p>}
        {author.status === 'approved' && (
          <Link to="/writer" className="btn btn-primary btn-block mt-3">ไปแดชบอร์ด</Link>
        )}
        {author.status === 'rejected' && (
          <p className="muted mt-3" style={{ fontSize: 13 }}>เหตุผล: {author.reject_reason || '—'} · สมัครใหม่ได้ด้านล่าง</p>
        )}
        {author.status === 'rejected' && (
          <form onSubmit={onSubmit} className="mt-3">
            <div className="field"><label>นามปากกา</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field"><label>แนะนำตัวสั้น ๆ</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ padding: 12 }} /></div>
            <button type="submit" className="btn btn-primary btn-block">สมัครใหม่</button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>{done ? 'ส่งใบสมัครแล้ว' : 'สมัครนักเขียน'}</h1>
      {done ? (
        <>
          <p className="muted">สถานะ pending · รอแอดมินอนุมัติใน mock</p>
          <Link to="/writer" className="btn btn-ghost btn-block mt-3">กลับแดชบอร์ด</Link>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>แบบฟอร์มสั้น · ยังไม่ใช่ KYC จริง · บัญชี writer@example.com อนุมัติไว้แล้ว</p>
          <div className="field"><label>นามปากกา</label><input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>แนะนำตัวสั้น ๆ</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ padding: 12 }} /></div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">ส่งใบสมัคร</button>
        </form>
      )}
    </div>
  );
}
