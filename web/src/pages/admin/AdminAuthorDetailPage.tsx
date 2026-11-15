import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { AdminModal, AdminPageHeader } from '../../components/AdminModal';
import { PillMenu } from '../../components/PillMenu';
import { ageRatingLabel, mockDb, type WriterChapter, type WriterWork } from '../../lib/mock/store';

export function AdminAuthorDetailPage() {
  const { authorId } = useParams();
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState('');
  const [notifyWork, setNotifyWork] = useState<WriterWork | null>(null);
  const [chapterId, setChapterId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  void tick;

  const author = authorId
    ? mockDb.listAuthorsRegistry().find((a) => a.id === authorId)
    : undefined;

  const works = useMemo(() => {
    if (!author) return [] as WriterWork[];
    return mockDb.listWriterWorks(author.id);
  }, [author, tick]);

  const chaptersOf = (workId: string): WriterChapter[] =>
    mockDb.listWriterChapters(workId);

  if (!author) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="ไม่พบนักแปล" />
        <Link to="/admin/authors" className="btn btn-ghost">← กลับคิวนักแปล</Link>
      </div>
    );
  }

  function toggleWork(w: WriterWork) {
    const next = w.status === 'published' ? 'suspended' : 'published';
    mockDb.setWriterWorkStatus(w.id, next);
    setTick((n) => n + 1);
    setNote(next === 'suspended' ? `ปิดการแสดง · ${w.title}` : `เปิดการแสดง · ${w.title}`);
  }

  function openNotify(w: WriterWork) {
    setNotifyWork(w);
    setChapterId('');
    setMessage('');
    setError('');
  }

  function sendNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyWork) return;
    try {
      mockDb.notifyWriterChapterIssue({
        author_id: author!.id,
        work_id: notifyWork.id,
        chapter_id: chapterId || undefined,
        message: message.trim() || 'กรุณาตรวจสอบเนื้อหาตอนนี้',
      });
      setNotifyWork(null);
      setNote(`ส่งแจ้งเตือนถึง ${author!.display_name} แล้ว`);
      setTick((n) => n + 1);
    } catch {
      setError('ส่งไม่สำเร็จ');
    }
  }

  const chapterOptions = notifyWork
    ? [
        { value: '', label: 'ทั้งเรื่อง (ไม่ระบุตอน)' },
        ...chaptersOf(notifyWork.id).map((c) => ({
          value: c.id,
          label: `ตอนที่ ${c.number} · ${c.title}`,
        })),
      ]
    : [];

  return (
    <div className="admin-page">
      <AdminPageHeader
        title={author.display_name}
        desc={`นักแปล · ${author.status} · user ${author.user_id}`}
        action={<Link to="/admin/authors" className="btn btn-ghost btn-sm">← รายชื่อ</Link>}
      />
      {author.bio && <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>{author.bio}</p>}
      {note && <p className="ok-note" style={{ marginBottom: 12 }}>{note}</p>}

      <div className="admin-section-h" style={{ marginTop: 0 }}>เรื่องที่แปล / สร้าง ({works.length})</div>
      <div className="card admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>เรื่อง</th>
              <th>หมวด</th>
              <th>เรท</th>
              <th>ตอน</th>
              <th>สถานะแสดง</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {works.map((w) => (
              <tr key={w.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{w.title}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{w.kind} · {w.slug}</div>
                </td>
                <td style={{ fontSize: 12 }}>{w.category || '—'}</td>
                <td>{ageRatingLabel(w.age_rating || 'all')}</td>
                <td>{chaptersOf(w.id).length}</td>
                <td>
                  <Badge kind={w.status === 'published' ? 'ok' : w.status === 'suspended' || w.status === 'takedown' ? 'danger' : 'note'}>
                    {w.status}
                  </Badge>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleWork(w)}>
                    {w.status === 'published' ? 'ปิดแสดง' : 'เปิดแสดง'}
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openNotify(w)}>
                    แจ้งเตือน
                  </button>
                </td>
              </tr>
            ))}
            {!works.length && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 20 }}>ยังไม่มีเรื่อง</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={!!notifyWork}
        title={notifyWork ? `แจ้งเตือน · ${notifyWork.title}` : ''}
        onClose={() => setNotifyWork(null)}
        wide
      >
        {notifyWork && (
          <form className="admin-modal-form" onSubmit={sendNotify}>
            <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
              ส่งถึงนักแปล <strong>{author.display_name}</strong> · ปรากฏในกระดิ่งแจ้งเตือน (mock)
            </p>
            <div className="field">
              <span>ตอนที่เกี่ยวข้อง</span>
              <PillMenu
                value={chapterId}
                options={chapterOptions}
                onChange={setChapterId}
                ariaLabel="เลือกตอน"
              />
            </div>
            <label className="field">
              <span>ข้อความถึงนักแปล</span>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="เช่น ภาพตอนที่ 12 มีเนื้อหาไม่เหมาะ กรุณาเซ็นเซอร์ใหม่"
                style={{ minHeight: 100, padding: 12 }}
              />
            </label>
            {error && <p className="admin-form-error">{error}</p>}
            <div className="admin-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setNotifyWork(null)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary">ส่งแจ้งเตือน</button>
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
