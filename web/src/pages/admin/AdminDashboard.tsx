import { Link } from 'react-router-dom';
import { mockDb } from '../../lib/mock/store';
import { Badge } from '../../components/Badge';

export function AdminDashboard() {
  const s = mockDb.adminSummary();
  return (
    <>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Dashboard</h1>
      <div className="stat-grid">
        <div className="card stat"><div className="lbl">เติมวันนี้</div><div className="val">{s.topup_today_label}</div><Badge kind="ex">mock</Badge></div>
        <div className="card stat"><div className="lbl">เหรียญค้าง (LIABILITY)</div><div className="val">{s.liability_label}</div></div>
        <div className="card stat"><div className="lbl">คิวอนุมัตินักเขียน</div><div className="val">{s.authors_pending}</div></div>
        <div className="card stat"><div className="lbl">รายงานรอตรวจ</div><div className="val">{s.reports_open}</div></div>
        <div className="card stat"><div className="lbl">Takedown เปิด</div><div className="val">{s.takedowns_open}</div></div>
        <div className="card stat"><div className="lbl">ถอนรอตรวจ</div><div className="val">{s.payouts_pending}</div></div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>กิจกรรมล่าสุด / ทางลัด</div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>รายการ audit / อนุมัติ / ปรับยอด (ตัวอย่าง) — ใช้เมนูด้านซ้าย</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link className="btn btn-ghost" to="/admin/authors">อนุมัตินักเขียน</Link>
          <Link className="btn btn-ghost" to="/admin/reports">รายงาน</Link>
          <Link className="btn btn-ghost" to="/admin/takedowns">Takedown</Link>
          <Link className="btn btn-ghost" to="/admin/payouts">ถอนเงิน</Link>
          <Link className="btn btn-ghost" to="/admin/ledger">Ledger</Link>
        </div>
      </div>
    </>
  );
}
