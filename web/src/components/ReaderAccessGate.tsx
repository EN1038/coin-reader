import { Link } from 'react-router-dom';
import type { Chapter, Work } from '../lib/types';
import { seriesPathFor } from '../lib/access';

export type ReaderGateKind = 'need_login' | 'need_unlock' | 'error';

type Props = {
  kind: ReaderGateKind;
  work: Work | null;
  chapter: Chapter | null;
  message?: string;
  readerClass: string;
};

export function ReaderAccessGate({ kind, work, chapter, message, readerClass }: Props) {
  const seriesHref = work ? seriesPathFor(work) : '/';
  const loginNext = work
    ? `/auth/login?next=${encodeURIComponent(seriesPathFor(work))}`
    : '/auth/login';

  const title =
    kind === 'need_login'
      ? 'ต้องสมัครหรือเข้าสู่ระบบ'
      : kind === 'need_unlock'
        ? 'ตอนนี้ต้องใช้ Gold'
        : 'อ่านไม่ได้';

  const body =
    message
    ?? (kind === 'need_login'
      ? 'ตอนฟรีอ่านได้โดยไม่สมัคร · ตอนเสียเหรียญต้องเข้าสู่ระบบก่อนจึงจะปลดล็อกได้'
      : kind === 'need_unlock'
        ? 'บัญชีนี้ยังไม่ได้ปลดล็อกตอนนี้ — กลับไปหน้าเรื่องเพื่อใช้ Gold หรือตั๋ว'
        : 'อาจยังไม่ได้ปลดล็อกหรือโหลดไม่สำเร็จ');

  return (
    <div className={`${readerClass} reader-shell`} style={{ padding: 24 }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h1>
      {chapter && (
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          ตอนที่ {chapter.number} · {chapter.title}
          {chapter.pricing === 'coin' && chapter.coin_price > 0 ? ` · ${chapter.coin_price} Gold` : ''}
        </p>
      )}
      <p style={{ marginBottom: 20, lineHeight: 1.55 }}>{body}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
        {kind === 'need_login' && (
          <>
            <Link className="btn btn-primary btn-block" to={loginNext}>เข้าสู่ระบบ</Link>
            <Link className="btn btn-ghost btn-block" to="/auth/signup">สมัครสมาชิก</Link>
          </>
        )}
        {kind === 'need_unlock' && work && (
          <Link className="btn btn-primary btn-block" to={seriesHref}>ไปปลดล็อกที่หน้าเรื่อง</Link>
        )}
        <Link className="btn btn-ghost btn-block" to={seriesHref}>
          {work ? 'กลับหน้าเรื่อง' : 'กลับหน้าแรก'}
        </Link>
      </div>
    </div>
  );
}
