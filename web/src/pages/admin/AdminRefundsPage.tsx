import { Link } from 'react-router-dom';
import { AdminPageHeader } from '../../components/AdminModal';

export function AdminRefundsPage() {
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="คืนเงิน"
        desc="กรณีชำระผิดพลาดจาก gateway — ไม่ใช่การคืนเหรียญในวอลเล็ต"
      />
      <div className="admin-list-item" style={{ maxWidth: 640, lineHeight: 1.65 }}>
        <div
          className="card"
          style={{
            background: 'var(--danger-bg)',
            borderColor: '#F0C8D0',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          <strong>ไม่ใช่การคืนเหรียญให้ผู้อ่าน</strong> — นโยบายล็อกแล้วว่าเหรียญคืนไม่ได้ / ไม่แลกเงินสด
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          หน้านี้เป็น stub สำหรับกรณีชำระเงินผ่าน gateway จริงแล้วเกิดข้อผิดพลาดจากระบบ
          อาจพิจารณาคืนเป็นเงินผ่านช่องทางชำระเดิม
        </p>
        <p className="muted" style={{ fontSize: 14, marginTop: 10 }}>
          MVP mock ไม่มีปุ่มคืนเหรียญ · ดู{' '}
          <Link to="/legal/coins" style={{ color: 'var(--primary)', fontWeight: 600 }}>นโยบายเหรียญ</Link>
        </p>
      </div>
    </div>
  );
}