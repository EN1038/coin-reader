import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Badge } from './Badge';
import { CoinAmount } from './CoinAmount';

export function UnlockSheet({
  title,
  price,
  onConfirm,
  onClose,
  onUseTicket,
  tickets = 0,
  busy,
  mode = 'chapter',
}: {
  title: string;
  price: number;
  onConfirm: () => void;
  onClose: () => void;
  onUseTicket?: () => void;
  tickets?: number;
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
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>Gold ไม่พอ</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {title} · <Badge kind="ex">ตัวอย่าง</Badge>
            </p>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ราคา</span>
                <CoinAmount value={price} currency="gold" className="head-amt" />
              </div>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ยอด Gold</span>
                <span>{balance}</span>
              </div>
              <div className="row-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>ขาดอีก</span>
                <CoinAmount value={Math.max(0, price - balance)} currency="gold" className="head-amt danger" />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Gold คืนเงินสดไม่ได้ · ดูนโยบายเหรียญก่อนเติม
            </p>
            <Link to="/wallet/topup" className="btn btn-coin btn-block" onClick={onClose}>
              ไปเติม Gold
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
                <CoinAmount value={price} currency="gold" className="head-amt" />
              </div>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span>ยอด Gold</span>
                <span>{balance}</span>
              </div>
              <div className="row-between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <span style={{ fontWeight: 600 }}>ยอดหลังหัก</span>
                <CoinAmount value={balance - price} currency="gold" className="head-amt primary" />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              ปลดล็อกแล้วอ่านได้ถาวรในบัญชีนี้ · Gold ที่ใช้ไปคืนไม่ได้
            </p>
            <button type="button" className="btn btn-coin btn-block" disabled={busy} onClick={onConfirm}>
              {busy ? 'กำลังปลดล็อก…' : `ยืนยันใช้ ${price} Gold`}
            </button>
            {mode === 'chapter' && onUseTicket && tickets > 0 && (
              <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={busy} onClick={onUseTicket}>
                ใช้ตั๋วอ่านฟรี 1 ใบ (เหลือ {tickets})
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onClose} disabled={busy}>
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  );
}
