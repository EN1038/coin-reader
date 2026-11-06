import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/supabase';
import type { Author, Work } from '../lib/types';
import { Cover } from '../components/CoverCard';
import { Badge } from '../components/Badge';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

const BIOS: Record<string, string> = {
  'a-001': 'เขียนนิยายโรแมนติกและชีวิตประจำวัน · สนใจคาเฟ่กลางดึกและเมืองฝนตก (ชีวประวัติสั้น — ตัวอย่าง)',
  'a-002': 'นักเขียนสมมติแนวสยองและจดหมาย · ชอบเงาและทะเล (ชีวประวัติสั้น — ตัวอย่าง)',
  'a-003': 'วาดมังงะแฟนตาซีและไซไฟตัวอย่าง · เกาะ ลม และดาวเทียม (ชีวประวัติสั้น — ตัวอย่าง)',
};

function initials(name: string): string {
  return name.trim().slice(0, 2) || '?';
}

export function AuthorPage() {
  const { authorId } = useParams();
  const nav = useNavigate();
  const [author, setAuthor] = useState<Author | null>(null);
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    (async () => {
      if (!authorId) return;
      let a: Author | undefined;
      if (isMockMode) {
        a = mockDb.authors.find((x) => x.id === authorId);
      }
      if (!a) {
        // fallback: derive from works
        const all = await api.listWorks();
        const sample = all.find((w) => w.author_id === authorId);
        if (sample) a = { id: sample.author_id, display_name: sample.author_name };
      }
      if (!a) {
        setAuthor(null);
        setWorks([]);
        return;
      }
      setAuthor(a);
      const list = (await api.listWorks()).filter((w) => w.author_id === a!.id);
      setWorks(list);
    })();
  }, [authorId]);

  if (!author) {
    return (
      <div className="pad center">
        <p className="mb-3">ไม่พบนักเขียน</p>
        <button type="button" className="btn btn-primary" onClick={() => nav(-1)}>กลับ</button>
      </div>
    );
  }

  const chapterCount = works.reduce((n, w) => n + w.chapter_count, 0);

  return (
    <>
      <div className="author-hero">
        <button
          type="button"
          className="icon-btn"
          style={{ position: 'absolute', top: 12, left: 8, color: 'var(--on-hero)' }}
          onClick={() => nav(-1)}
          aria-label="กลับ"
        >
          ←
        </button>
        <div className="author-av">{initials(author.display_name)}</div>
        <h1 style={{ fontSize: 22, color: 'var(--on-hero)' }}>{author.display_name}</h1>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>นามปากกา · นักเขียนตัวอย่าง</div>
        <span
          className="badge badge-ex"
          style={{ marginTop: 10, background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
        >
          โปรไฟล์ตัวอย่าง
        </span>
        <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9, maxWidth: 320, margin: '10px auto 0' }}>
          {BIOS[author.id] ?? 'นักเขียนบน Twilight Blue (ชีวประวัติสั้น — ตัวอย่าง)'}
        </p>
        <div className="author-stats">
          <div><b>{works.length}</b><span>เรื่อง</span></div>
          <div><b>{chapterCount}</b><span>ตอน</span></div>
          <div><b>—</b><span>ผู้ติดตาม</span></div>
        </div>
      </div>

      <div className="sec">
        <h2>ผลงาน</h2>
        <span className="ex">ตัวอย่าง</span>
      </div>
      {works.map((w) => (
        <Link key={w.id} to={`/works/${w.slug}`} className="author-work">
          <div className="thumb"><Cover work={w} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14 }}>{w.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0' }}>
              {w.kind === 'manga' ? 'มังงะ' : 'นิยาย'} · {w.category} · {w.chapter_count} ตอน
            </div>
            {w.price_full_work != null ? (
              <Badge kind="lock">🪙 ทั้งเล่ม {w.price_full_work}</Badge>
            ) : (
              <Badge kind="free">มีตอนฟรี</Badge>
            )}
          </div>
        </Link>
      ))}
      <p style={{ padding: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        หน้าสาธารณะ · ไม่ใช่ dashboard นักเขียน · ไม่มี VIP
      </p>
    </>
  );
}
