import { Link, useLocation, useParams } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { MockBanner } from '../components/MockBanner';
import { Badge } from '../components/Badge';

export function PayResultPage() {
  const { status } = useParams<{ status: string }>();
  const loc = useLocation() as { state?: { coins?: number; balance?: number; message?: string } };
  const st = status === 'success' || status === 'fail' || status === 'pending' ? status : 'pending';

  const title = st === 'success' ? 'ชำระสำเร็จ' : st === 'fail' ? 'ชำระไม่สำเร็จ' : 'รอการยืนยัน';
  const color = st === 'success' ? 'var(--ok)' : st === 'fail' ? 'var(--danger)' : 'var(--primary)';

  return (
    <>
      <Topbar title={title} back="/wallet/topup" showCoin={false} />
      <div className="pad">
        <MockBanner />
        <div className="card center mt-3" style={{ padding: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {st === 'success' ? '✓' : st === 'fail' ? '✕' : '…'}
          </div>
          <h1 style={{ fontSize: 22, color, marginBottom: 8 }}>{title}</h1>
          <Badge kind="ex">ผลจำลอง (mock)</Badge>
          {st === 'success' && (
            <p className="muted mt-3" style={{ lineHeight: 1.6 }}>
              ได้รับ <strong style={{ color: 'var(--text)' }}>🪙 {loc.state?.coins ?? '—'}</strong> เหรียญ
              <br />
              ยอดคงเหลือ <strong style={{ color: 'var(--text)' }}>{loc.state?.balance ?? '—'}</strong>
            </p>
          )}
          {st === 'pending' && (
            <p className="muted mt-3">กำลังจำลองการยืนยันชำระ… ในระบบจริงต้องรอ webhook จาก gateway</p>
          )}
          {st === 'fail' && (
            <p className="muted mt-3">{loc.state?.message || 'การชำระจำลองล้มเหลว'}</p>
          )}
          <p className="ex mt-3">เหรียญคืนไม่ได้</p>
        </div>
        <div className="stack mt-4">
          {st === 'success' && (
            <>
              <Link to="/wallet" className="btn btn-primary btn-block">ดูกระเป๋า</Link>
              <Link to="/" className="btn btn-ghost btn-block">กลับหน้าแรก</Link>
            </>
          )}
          {st === 'fail' && (
            <>
              <Link to="/wallet/topup" className="btn btn-coin btn-block">ลองใหม่</Link>
              <Link to="/wallet" className="btn btn-ghost btn-block">กระเป๋า</Link>
            </>
          )}
          {st === 'pending' && (
            <Link to="/wallet" className="btn btn-ghost btn-block">ไปกระเป๋า</Link>
          )}
        </div>
      </div>
    </>
  );
}
