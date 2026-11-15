import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { CURRENCY_GOLD } from '../../lib/brand';
import { requireApprovedAuthor } from './WriterLayout';

const UPLOAD_SPEED_KEY = 'sm-writer-upload-speed';
const ZIP_MAX = 100 * 1024 * 1024;

type UploadMode = 'single' | 'multi';
type ChapterStatus = 'draft' | 'published';

export function WriterChapterForm() {
  const { workId, chapterId } = useParams();
  const isNew = !chapterId || chapterId === 'new';
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const nav = useNavigate();
  const work = workId ? mockDb.getWriterWork(workId) : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const siblings = workId ? mockDb.listWriterChapters(workId) : [];
  const nextNum = siblings.reduce((m, c) => Math.max(m, c.number), 0) + 1;

  const [mode, setMode] = useState<UploadMode>('single');
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState(nextNum);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<ChapterStatus>('published');
  const [uploadSpeed, setUploadSpeed] = useState(() => localStorage.getItem(UPLOAD_SPEED_KEY) || 'fast');
  const [body, setBody] = useState('');
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [zipName, setZipName] = useState<string | null>(null);
  const [followFree, setFollowFree] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && chapterId) {
      const c = mockDb.getWriterChapter(chapterId);
      if (c) {
        setTitle(c.title);
        setNumber(c.number);
        setPrice(c.pricing === 'coin' ? c.coin_price : 0);
        setStatus(c.status);
        setBody(c.body);
        setImageNames(c.image_names ?? []);
        setZipName(c.zip_name ?? null);
        setFollowFree(!!c.follow_free);
        setMode(c.zip_name ? 'multi' : 'single');
      }
    }
  }, [isNew, chapterId]);

  useEffect(() => {
    localStorage.setItem(UPLOAD_SPEED_KEY, uploadSpeed);
  }, [uploadSpeed]);

  if (gate) return gate;
  if (!work || work.author_id !== author!.id) {
    return <div className="card">ไม่พบเรื่อง</div>;
  }

  function onImages(files: FileList | null) {
    if (!files?.length) return;
    const names = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => f.name);
    setImageNames(names);
    setZipName(null);
  }

  function onZip(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('กรุณาเลือกไฟล์ .zip');
      return;
    }
    if (file.size > ZIP_MAX) {
      setError('ไฟล์ใหญ่เกิน 100MB');
      return;
    }
    setError('');
    setZipName(file.name);
    setImageNames([]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (work!.kind === 'manga' && mode === 'single' && !imageNames.length && isNew) {
      setError('เพิ่มอย่างน้อย 1 รูป หรือใช้โหมดหลายตอน (ZIP)');
      return;
    }
    if (mode === 'multi' && !zipName && isNew) {
      setError('เลือกไฟล์ ZIP');
      return;
    }
    try {
      if (mode === 'multi' && zipName && isNew) {
        // mock: สร้างตอนเดียวแทนการแตก ZIP — เก็บชื่อไฟล์ไว้
        mockDb.saveWriterChapter({
          work_id: work!.id,
          title: title.trim() || zipName.replace(/\.zip$/i, ''),
          number,
          pricing: price > 0 ? 'coin' : 'free',
          coin_price: price,
          follow_free: price > 0 && followFree,
          status,
          body: '',
          page_count: 0,
          image_names: [],
          zip_name: zipName,
        });
      } else {
        mockDb.saveWriterChapter({
          id: isNew ? undefined : chapterId,
          work_id: work!.id,
          title: title.trim(),
          number,
          pricing: price > 0 ? 'coin' : 'free',
          coin_price: price,
          follow_free: price > 0 && followFree,
          status,
          body: work!.kind === 'novel' ? body : '',
          page_count: work!.kind === 'manga' ? imageNames.length || 1 : 0,
          image_names: work!.kind === 'manga' ? imageNames : [],
          zip_name: null,
        });
      }
      nav('/writer/works');
    } catch {
      setError('บันทึกไม่สำเร็จ');
    }
  }

  return (
    <div className="wf-form">
      <div className="wf-form-head">
        <h1 className="wf-form-title">{isNew ? 'เพิ่มตอนใหม่' : 'แก้ไขตอน'}</h1>
        <Link to="/writer/works" className="btn btn-ghost">ยกเลิก</Link>
      </div>
      <p className="muted mb-3" style={{ fontSize: 13 }}>{work.title}</p>

      {work.kind === 'manga' && (
        <div className="wf-mode-toggle" role="tablist">
          <button
            type="button"
            className={mode === 'single' ? 'active' : ''}
            onClick={() => setMode('single')}
          >
            ตอนเดียว (Single)
          </button>
          <button
            type="button"
            className={mode === 'multi' ? 'active' : ''}
            onClick={() => setMode('multi')}
          >
            หลายตอน (Multi)
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="wf-stack">
        {mode === 'single' || work.kind === 'novel' ? (
          <section className="wf-card">
            <div className="field">
              <label>ชื่อตอน</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ใส่ชื่อตอน (ว่างได้)" />
            </div>
            <div className="field">
              <label>ตอนที่</label>
              <input type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value) || 1)} />
            </div>
            <div className="field">
              <label className="wf-label-row">
                <span>ราคา (0 = ฟรี)</span>
                <img src={CURRENCY_GOLD} alt="" width={18} height={18} className="coin-amount-img" />
              </label>
              <input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
              <div className="hint">หน่วย Gold · ตั้งได้ไม่เท่ากันทุกตอน</div>
            </div>
            {price > 0 && (
              <label className="row" style={{ gap: 8, marginBottom: 12, fontSize: 14 }}>
                <input type="checkbox" checked={followFree} onChange={(e) => setFollowFree(e.target.checked)} />
                ติดตามแล้วอ่านตอนนี้ฟรี
              </label>
            )}
            <div className="field">
              <label>สถานะ</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ChapterStatus)}>
                <option value="published">เผยแพร่</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>
            <div className="field">
              <label>ความเร็วในการอัปโหลด</label>
              <select value={uploadSpeed} onChange={(e) => setUploadSpeed(e.target.value)}>
                <option value="fast">เร็วสุด — เหมาะสำหรับอินเทอร์เน็ตความเร็วสูง</option>
                <option value="normal">ปกติ</option>
                <option value="safe">ช้า / ประหยัดแบนด์วิดท์</option>
              </select>
              <div className="hint">ค่านี้จะถูกจดจำสำหรับการใช้งานครั้งถัดไป</div>
            </div>

            {work.kind === 'novel' ? (
              <div className="field">
                <label>เนื้อหา (นิยาย)</label>
                <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 180, padding: 12 }} />
              </div>
            ) : (
              <div className="field">
                <label>รูปภาพ ({imageNames.length} รูป)</label>
                <button type="button" className="wf-dropzone" onClick={() => fileRef.current?.click()}>
                  <span className="wf-drop-ic" aria-hidden>+</span>
                  <span>คลิกเพื่อเพิ่มรูปภาพ หรือลากไฟล์มาวางที่นี่</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => onImages(e.target.files)}
                />
                {!!imageNames.length && (
                  <ul className="wf-file-list">
                    {imageNames.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ) : (
          <section className="wf-card">
            <p className="wf-zip-lead">อัพโหลดไฟล์ ZIP ที่มีโครงสร้างดังนี้:</p>
            <div className="wf-zip-guide">
              <div>
                <strong className="wf-zip-h">ตอนเดียว</strong>
                <pre>{`1.jpg\n2.jpg`}</pre>
                <p className="wf-zip-note">โปรดตั้งชื่อไฟล์ตามชื่อตอน เช่น ตอนที่ 23.zip</p>
              </div>
              <div>
                <strong className="wf-zip-h">หลายตอน</strong>
                <pre>{`ตอนที่ 1/\n  1.jpg\n  2.jpg\nตอนที่ 2/\n  1.jpg\n  2.jpg`}</pre>
              </div>
            </div>
            <p className="wf-zip-note">รองรับไฟล์ขนาดสูงสุด: 100MB · เดโม mock ยังไม่แตก ZIP จริง</p>

            <div className="field">
              <label>ตอนที่เริ่มต้น</label>
              <input type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value) || 1)} />
            </div>
            <div className="field">
              <label>ราคาต่อตอน (0 = ฟรี)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div className="field">
              <label>สถานะ</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ChapterStatus)}>
                <option value="published">เผยแพร่</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>

            <div className="field">
              <label>ไฟล์ ZIP</label>
              <div className="wf-zip-pick">
                <button type="button" className="btn btn-ghost" onClick={() => zipRef.current?.click()}>
                  เลือกไฟล์
                </button>
                <span className="muted">{zipName || 'ไม่ได้เลือกไฟล์ใด'}</span>
              </div>
              <input ref={zipRef} type="file" accept=".zip,application/zip" hidden onChange={(e) => onZip(e.target.files?.[0])} />
            </div>
          </section>
        )}

        {error && <p className="wf-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">บันทึกตอน (mock)</button>
        <Link to="/writer/works" className="btn btn-ghost btn-block">ยกเลิก</Link>
      </form>
    </div>
  );
}
