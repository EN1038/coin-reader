import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { mockDb, type AuthorRecord, type WorkAdminStatus } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterWorkForm() {
  const { workId } = useParams();
  const isNew = !workId || workId === 'new';
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [kind, setKind] = useState<'novel' | 'manga'>('novel');
  const [category, setCategory] = useState('โรแมนติก');
  const [status, setStatus] = useState<WorkAdminStatus>('draft');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && workId) {
      const w = mockDb.getWriterWork(workId);
      if (w) {
        setTitle(w.title);
        setSynopsis(w.synopsis);
        setKind(w.kind);
        setCategory(w.category);
        setStatus(w.status === 'takedown' ? 'suspended' : w.status);
      }
    }
  }, [isNew, workId]);

  if (gate) return gate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const saved = mockDb.saveWriterWork({
        id: isNew ? undefined : workId,
        author_id: author!.id,
        title,
        synopsis,
        kind,
        category,
        status,
      });
      nav(`/writer/works`);
      void saved;
    } catch {
      setError('บันทึกไม่สำเร็จ');
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>{isNew ? 'สร้างเรื่อง' : 'แก้ไขเรื่อง'}</h1>
      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 640 }}>
        <div className="field"><label>ชื่อเรื่อง</label><input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>เรื่องย่อ</label><textarea required rows={4} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} style={{ minHeight: 100, padding: 12 }} /></div>
        <div className="field"><label>ประเภท</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'novel' | 'manga')}>
            <option value="novel">นิยาย</option>
            <option value="manga">มังงะ</option>
          </select>
        </div>
        <div className="field"><label>หมวด</label><input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
        <div className="field"><label>สถานะ</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as WorkAdminStatus)}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="suspended">suspended</option>
          </select>
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">บันทึก (mock)</button>
        <Link to="/writer/works" className="btn btn-ghost btn-block mt-2">ยกเลิก</Link>
      </form>
    </>
  );
}
