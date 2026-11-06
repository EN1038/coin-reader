import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Badge } from './Badge';

export function UnlockSheet({
  title,
  price,
  onConfirm,
  onClose,
  busy,
  mode = 'chapter',
}: {
  title: string;
  price: number;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  mode?: 'chapter' | 'work' | 'insufficient';
}) {
  const { balance } = useApp();
  const insufficient = balance < price || mode === 'insufficient';

  return (
    <div className="sheet-bg" onClick={onClose} role="presentation">
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="handle" />
        {insufficient ? (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>เหรียญไม่พอ</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {title} · <Badge kind="ex">ตัวอย่าง</Badge>
            </p>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ราคา</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>🪙 {price}</span>
              </div>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ยอดปัจจุบัน</span>
                <span>{balance}</span>
              </div>
              <div className="row-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>ขาดอีก</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--danger)' }}>
                  🪙 {Math.max(0, price - balance)}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              เหรียญคืนไม่ได้ · ดูนโยบายเหรียญก่อนเติม
            </p>
            <Link to="/wallet/topup" className="btn btn-coin btn-block" onClick={onClose}>
              ไปเติมเหรียญ
            </Link>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onClose}>
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>ยืนยันปลดล็อก</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {title} · <span className="ex">ตัวอย่าง</span>
            </p>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>{mode === 'work' ? 'ราคาทั้งเล่ม' : 'ราคาตอน'}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>🪙 {price}</span>
              </div>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ยอดปัจจุบัน</span>
                <span>{balance}</span>
              </div>
              <div className="row-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>ยอดหลังหัก</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)' }}>
                  🪙 {balance - price}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              ปลดล็อกแล้วอ่านได้ถาวรในบัญชีนี้ · เหรียญที่ใช้ไปคืนไม่ได้
            </p>
            <button type="button" className="btn btn-coin btn-block" disabled={busy} onClick={onConfirm}>
              {busy ? 'กำลังปลดล็อก…' : `ยืนยันใช้ ${price} เหรียญ`}
            </button>
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onClose} disabled={busy}>
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
