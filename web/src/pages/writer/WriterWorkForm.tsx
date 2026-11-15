import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  ageRatingLabel,
  mockDb,
  type AgeRating,
  type AuthorRecord,
  type ContentLanguage,
  type SeriesStatus,
  type WorkAdminStatus,
} from '../../lib/mock/store';
import { COVER_DEFAULT } from '../../lib/brand';
import { IconChevronLeft, IconChevronRight } from '../../components/icons';
import { requireApprovedAuthor } from './WriterLayout';

const CAT_PAGE = 6;

function slugify(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function WriterWorkForm() {
  const { workId } = useParams();
  const isNew = !workId || workId === 'new';
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  const nav = useNavigate();
  const coverInput = useRef<HTMLInputElement>(null);

  const categories = mockDb.listCategories(false);
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortSynopsis, setShortSynopsis] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [kind, setKind] = useState<'novel' | 'manga'>('manga');
  const [ageRating, setAgeRating] = useState<AgeRating>('all');
  const [language, setLanguage] = useState<ContentLanguage>('th');
  const [seriesStatus, setSeriesStatus] = useState<SeriesStatus>('ongoing');
  const [status, setStatus] = useState<WorkAdminStatus>('draft');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState('');
  const [catPage, setCatPage] = useState(0);
  const [freeCount, setFreeCount] = useState(2);
  const [coverUrl, setCoverUrl] = useState<string>(COVER_DEFAULT);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && workId) {
      const w = mockDb.getWriterWork(workId);
      if (w) {
        setTitle(w.title);
        setOriginalTitle(w.original_title || w.title);
        setSlug(w.slug);
        setSlugTouched(true);
        setShortSynopsis(w.short_synopsis || '');
        setSynopsis(w.synopsis);
        setKind(w.kind);
        setAgeRating(w.age_rating || 'all');
        setLanguage(w.language || 'th');
        setSeriesStatus(w.series_status || 'ongoing');
        setStatus(w.status === 'takedown' ? 'suspended' : w.status);
        setCategoryIds(w.category_ids?.length ? w.category_ids : []);
        setFreeCount(w.free_episode_count ?? 0);
        setCoverUrl(w.cover_url || COVER_DEFAULT);
      }
    }
  }, [isNew, workId]);

  useEffect(() => {
    if (!slugTouched && title) setSlug(slugify(title));
  }, [title, slugTouched]);

  const filteredCats = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return categories.filter((c) => !q || c.name.toLowerCase().includes(q) || c.slug.includes(q));
  }, [categories, catQuery]);

  const catPages = Math.max(1, Math.ceil(filteredCats.length / CAT_PAGE));
  const pageCats = filteredCats.slice(catPage * CAT_PAGE, catPage * CAT_PAGE + CAT_PAGE);

  if (gate) return gate;

  function toggleCat(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function onCover(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCoverUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!originalTitle.trim()) {
      setError('กรุณากรอกชื่อต้นฉบับ');
      return;
    }
    if (!categoryIds.length) {
      setError('เลือกอย่างน้อย 1 หมวดหมู่');
      return;
    }
    const cleanSlug = slugify(slug || title);
    if (!cleanSlug) {
      setError('ลิงก์ URL ไม่ถูกต้อง (ตัวพิมพ์เล็กและขีดกลางเท่านั้น)');
      return;
    }
    try {
      mockDb.saveWriterWork({
        id: isNew ? undefined : workId,
        author_id: author!.id,
        title: title.trim(),
        original_title: originalTitle.trim(),
        slug: cleanSlug,
        short_synopsis: shortSynopsis.trim().slice(0, 140),
        synopsis: synopsis.trim(),
        kind,
        category_ids: categoryIds,
        age_rating: ageRating,
        language,
        series_status: seriesStatus,
        status,
        free_episode_count: Math.max(0, freeCount),
        cover_url: coverUrl,
      });
      nav('/writer/works');
    } catch {
      setError('บันทึกไม่สำเร็จ');
    }
  }

  return (
    <div className="wf-form">
      <h1 className="wf-form-title">{isNew ? 'สร้างเรื่อง' : 'แก้ไขเรื่อง'}</h1>
      <form onSubmit={onSubmit} className="wf-stack">
        <section className="wf-card">
          <h2 className="wf-card-h">ข้อมูลเนื้อหา</h2>

          <div className="field">
            <label>ชื่อเรื่อง <span className="hint">(แสดงภาษาไทย / อังกฤษ)</span></label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อเรื่อง" />
          </div>

          <div className="field">
            <label>ชื่ออื่นๆ (ต้นฉบับ) <span className="req">*</span></label>
            <input
              required
              value={originalTitle}
              onChange={(e) => setOriginalTitle(e.target.value)}
              placeholder="ชื่อต้นฉบับ เช่น 俺だけレベルアップ"
            />
            <div className="hint">ชื่อเรื่องต้นฉบับ หรือชื่ออื่นๆ ที่ใช้ค้นหาได้</div>
          </div>

          <div className="field">
            <label>เรทอายุ <span className="req">*</span></label>
            <select value={ageRating} onChange={(e) => setAgeRating(e.target.value as AgeRating)} required>
              <option value="all">เหมาะสำหรับผู้ชมทุกวัย ({ageRatingLabel('all')})</option>
              <option value="13">13+</option>
              <option value="15">15+</option>
              <option value="18">18+</option>
            </select>
            <p className="wf-warn">หากตั้งไม่ตรงกับเนื้อหามีโอกาสโดนระงับบัญชี</p>
          </div>

          <div className="field">
            <label>ลิงก์ URL</label>
            <div className="wf-slug">
              <span className="wf-slug-prefix">/content/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="my-series"
              />
            </div>
            <div className="hint">URL ที่ใช้เข้าถึงเนื้อหา (ตัวพิมพ์เล็กและขีดกลางเท่านั้น)</div>
          </div>

          <div className="field">
            <label>รายละเอียดแบบย่อ ({shortSynopsis.length}/140)</label>
            <textarea
              rows={2}
              maxLength={140}
              value={shortSynopsis}
              onChange={(e) => setShortSynopsis(e.target.value.slice(0, 140))}
              placeholder="คำอธิบายแบบย่อ"
            />
            <div className="hint">จะแสดงในผลการค้นหาและหน้าแสดงตัวอย่าง</div>
          </div>

          <div className="field">
            <label>รายละเอียด</label>
            <textarea
              rows={5}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="เรื่องย่อแบบเต็ม"
              style={{ minHeight: 120 }}
            />
          </div>

          <div className="field">
            <label>ประเภทเนื้อหา</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as 'novel' | 'manga')}>
              <option value="manga">มังงะ</option>
              <option value="novel">นิยาย</option>
            </select>
          </div>

          <div className="field">
            <label>จำนวนตอนฟรีช่วงต้น</label>
            <input type="number" min={0} value={freeCount} onChange={(e) => setFreeCount(Number(e.target.value))} />
            <div className="hint">ตอนที่ 1 ถึงเลขนี้เปิดให้อ่านฟรี แม้ตอนนั้นจะตั้งราคา Gold ไว้</div>
          </div>
        </section>

        <section className="wf-card">
          <h2 className="wf-card-h">หมวดหมู่</h2>
          <div className="wf-cat-tools">
            <input
              className="wf-cat-search"
              value={catQuery}
              onChange={(e) => {
                setCatQuery(e.target.value);
                setCatPage(0);
              }}
              placeholder="ค้นหาหมวดหมู่..."
            />
          </div>
          <ul className="wf-cat-list">
            {pageCats.map((c) => (
              <li key={c.id}>
                <label className="wf-cat-row">
                  <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCat(c.id)} />
                  <span>{c.name}</span>
                </label>
              </li>
            ))}
            {!pageCats.length && <li className="muted" style={{ padding: 12 }}>ไม่พบหมวดหมู่</li>}
          </ul>
          <div className="wf-cat-foot">
            <span>เลือกแล้ว {categoryIds.length} หมวดหมู่</span>
            <div className="wf-pager">
              <button type="button" className="btn btn-ghost" disabled={catPage <= 0} onClick={() => setCatPage((p) => p - 1)} aria-label="หมวดก่อนหน้า">
                <IconChevronLeft size={18} />
              </button>
              <span>{catPage + 1}/{catPages}</span>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={catPage >= catPages - 1}
                onClick={() => setCatPage((p) => p + 1)}
                aria-label="หมวดถัดไป"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="wf-card">
          <h2 className="wf-card-h">ภาษา · สถานะ · รูปปก</h2>
          <div className="field">
            <label>ภาษา</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as ContentLanguage)}>
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <label>สถานะเรื่อง</label>
            <select value={seriesStatus} onChange={(e) => setSeriesStatus(e.target.value as SeriesStatus)}>
              <option value="ongoing">ยังไม่จบ</option>
              <option value="completed">จบแล้ว</option>
            </select>
          </div>
          <div className="field">
            <label>สถานะเผยแพร่</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as WorkAdminStatus)}>
              <option value="draft">แบบร่าง</option>
              <option value="published">เผยแพร่</option>
              <option value="suspended">ระงับ</option>
            </select>
          </div>

          <div className="field">
            <label>รูปปก</label>
            <div className="wf-cover-warn">
              สำคัญ!! ภาพปกที่มีเนื้อหาลามก อนาจาร หรือเปลือยกาย โปรดทำการเซ็นเซอร์
            </div>
            <button
              type="button"
              className="wf-cover-box"
              onClick={() => coverInput.current?.click()}
              style={{ backgroundImage: coverUrl ? `url(${coverUrl})` : undefined }}
            >
              {!coverUrl || coverUrl === COVER_DEFAULT ? (
                <span className="wf-cover-empty">NO IMAGE · คลิกอัปโหลดปก</span>
              ) : (
                <span className="wf-cover-change">เปลี่ยนปก</span>
              )}
            </button>
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onCover(e.target.files?.[0])}
            />
          </div>
        </section>

        {error && <p className="wf-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">บันทึก (mock)</button>
        <Link to="/writer/works" className="btn btn-ghost btn-block">ยกเลิก</Link>
      </form>
    </div>
  );
}
