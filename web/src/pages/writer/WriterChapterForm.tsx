import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterChapterForm() {
  const { workId, chapterId } = useParams();
  const isNew = !chapterId || chapterId === 'new';
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const nav = useNavigate();
  const work = workId ? mockDb.getWriterWork(workId) : undefined;
  const [title, setTitle] = useState('');
  const [pricing, setPricing] = useState<'free' | 'coin'>('free');
  const [coinPrice, setCoinPrice] = useState(1);
  const [followFree, setFollowFree] = useState(false);
  const [body, setBody] = useState('');
  const [pageCount, setPageCount] = useState(3);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && chapterId) {
      const c = mockDb.getWriterChapter(chapterId);
      if (c) {
        setTitle(c.title);
        setPricing(c.pricing);
        setCoinPrice(c.coin_price || 1);
        setFollowFree(!!c.follow_free);
        setBody(c.body);
        setPageCount(c.page_count || 3);
      }
    }
  }, [isNew, chapterId]);

  if (gate) return gate;
  if (!work || work.author_id !== author!.id) {
    return <div className="card">ไม่พบเรื่อง</div>;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      mockDb.saveWriterChapter({
        id: isNew ? undefined : chapterId,
        work_id: work!.id,
        title,
        pricing,
        coin_price: pricing === 'coin' ? coinPrice : 0,
        follow_free: pricing === 'coin' && followFree,
        body: work!.kind === 'novel' ? body : '',
        page_count: work!.kind === 'manga' ? pageCount : 0,
        status: 'published',
      });
      nav('/writer/works');
    } catch {
      setError('บันทึกไม่สำเร็จ');
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>{isNew ? 'เพิ่มตอน' : 'แก้ไขตอน'}</h1>
      <p className="muted mb-3" style={{ fontSize: 13 }}>{work.title}</p>
      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 640 }}>
        <div className="field"><label>ชื่อตอน</label><input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>ราคา</label>
          <select value={pricing} onChange={(e) => setPricing(e.target.value as 'free' | 'coin')}>
            <option value="free">ฟรี</option>
            <option value="coin">เหรียญ</option>
          </select>
        </div>
        {pricing === 'coin' && (
          <>
            <div className="field"><label>ราคาเหรียญของตอนนี้</label>
              <input type="number" min={1} step={1} value={coinPrice} onChange={(e) => setCoinPrice(Number(e.target.value))} />
              <div className="hint">ตั้งได้ไม่เท่ากันทุกตอน เช่น 1, 2 หรือ 3 เหรียญ</div>
            </div>
            <label className="row" style={{ gap: 8, marginBottom: 12, fontSize: 14 }}>
              <input type="checkbox" checked={followFree} onChange={(e) => setFollowFree(e.target.checked)} />
              ติดตามแล้วอ่านตอนนี้ฟรี (ยังจ่ายเหรียญได้ถ้าไม่ติดตาม)
            </label>
          </>
        )}
        {work.kind === 'novel' ? (
          <div className="field"><label>เนื้อหา (นิยาย)</label>
            <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 180, padding: 12 }} placeholder="ข้อความตัวอย่าง" />
          </div>
        ) : (
          <div className="field"><label>จำนวนหน้า (มังงะ · stub)</label>
            <input type="number" min={1} value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} />
            <div className="hint">MVP mock ไม่ได้อัปโหลดภาพจริง — ใช้ SVG ฝั่งผู้อ่าน</div>
          </div>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">บันทึกตอน (mock)</button>
        <Link to="/writer/works" className="btn btn-ghost btn-block mt-2">ยกเลิก</Link>
      </form>
    </>
  );
}
