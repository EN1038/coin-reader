import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterDashboard() {
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const gate = requireApprovedAuthor(author);
  if (gate) return gate;
  const dash = mockDb.writerDashboard(author!.id);
  const p = dash.policy;

  return (
    <>
      <div className="card mb-3">
        <div className="muted" style={{ fontSize: 13 }}>สวัสดี</div>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>แดชบอร์ดนักเขียน</h1>
        <div style={{ marginTop: 8 }}><Badge kind="ex">metrics mock-fixture</Badge></div>
      </div>
      <div className="stat-grid">
        <div className="card stat"><div className="lbl">วิว (ตัวอย่าง)</div><div className="val">{dash.views_label}</div></div>
        <div className="card stat"><div className="lbl">ปลดล็อก</div><div className="val">{dash.unlock_count.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">รายได้ PENDING</div><div className="val">฿ {dash.earnings.pending.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">AVAILABLE</div><div className="val">฿ {dash.earnings.available.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">RESERVED</div><div className="val">฿ {dash.earnings.reserved.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">PAID</div><div className="val">฿ {dash.earnings.paid.toLocaleString()}</div></div>
      </div>
      <div className="card mb-3">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>ทางลัด</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link className="btn btn-ghost" to="/writer/works">ผลงาน ({dash.works_count})</Link>
          <Link className="btn btn-primary" to="/writer/works/new">สร้างเรื่อง</Link>
          <Link className="btn btn-ghost" to="/writer/payout">รายได้ / ถอน</Link>
          <Link className="btn btn-ghost" to={`/authors/${author!.id}`}>โปรไฟล์สาธารณะ</Link>
        </div>
      </div>
      <div className="card" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text)' }}>หมายเหตุ (placeholder ตัวอย่าง)</strong>
        <ul style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>ส่วนแบ่งนักเขียน {(p.writer_share_bps / 100).toFixed(0)}% / แพลตฟอร์ม {((10000 - p.writer_share_bps) / 100).toFixed(0)}% — ยังไม่ล็อกในผลิตภัณฑ์</li>
          <li>Hold {p.hold_days} วัน · ขั้นต่ำถอน ฿{p.minimum_payout}</li>
          <li>เหรียญผู้อ่านคืนไม่ได้ · ไม่มี VIP ใน MVP</li>
        </ul>
      </div>
    </>
  );
}
