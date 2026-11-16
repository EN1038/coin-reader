import { Link, useOutletContext } from 'react-router-dom';
import { Badge } from '../../components/Badge';
import { CoinAmount } from '../../components/CoinAmount';
import { useApp } from '../../context/AppContext';
import { mockDb, type AuthorRecord } from '../../lib/mock/store';
import { requireApprovedAuthor } from './WriterLayout';

export function WriterDashboard() {
  const { author } = useOutletContext<{ author?: AuthorRecord }>();
  const { diamond } = useApp();
  const gate = requireApprovedAuthor(author);
  if (gate) return gate;
  const dash = mockDb.writerDashboard(author!.id);
  const ach = mockDb.writerAchievement(author!.user_id);
  const feePct = (ach.fee_bps / 100).toFixed(0);

  return (
    <>
      <div className="card mb-3">
        <div className="muted" style={{ fontSize: 13 }}>สวัสดี</div>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>แดชบอร์ดนักแปล</h1>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge kind="ex">metrics mock</Badge>
          <div className={`tier-badge tier-writer tier-${ach.tier_id}`}>
            <span className="tier-badge-bob" aria-hidden />
            {ach.tier_label} · คอม {feePct}%
          </div>
        </div>
      </div>
      <div className="stat-grid">
        <div className="card stat"><div className="lbl">Diamond</div><div className="val"><CoinAmount value={diamond} currency="diamond" /></div></div>
        <div className="card stat"><div className="lbl">วิว (ตัวอย่าง)</div><div className="val">{dash.views_label}</div></div>
        <div className="card stat"><div className="lbl">ปลดล็อก</div><div className="val">{dash.unlock_count.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">AVAILABLE</div><div className="val">{dash.earnings.available.toLocaleString()} D</div></div>
        <div className="card stat"><div className="lbl">ยอดขายสะสม</div><div className="val">{ach.lifetime_sales.toLocaleString()}</div></div>
        <div className="card stat"><div className="lbl">เดือนนี้</div><div className="val">{ach.month_sales.toLocaleString()}</div></div>
      </div>
      <div className="card mb-3">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>ทางลัด</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link className="btn btn-ghost" to="/writer/works">ผลงาน ({dash.works_count})</Link>
          <Link className="btn btn-primary" to="/writer/works/new">สร้างเรื่อง</Link>
          <Link className="btn btn-ghost" to="/writer/payout">รายได้ / ถอน Diamond</Link>
          <Link className="btn btn-ghost" to={`/authors/${author!.id}`}>โปรไฟล์สาธารณะ</Link>
        </div>
      </div>
      <div className="card" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text)' }}>ระบบ Diamond</strong>
        <ul style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>ค่าคอมปัจจุบัน {feePct}% (ฐาน 10% · ลดตามระดับ achievement)</li>
          <li>รักษาระดับ: ยอดเดือน ≥ 25% ของเกณฑ์ระดับ ({ach.maintain_need.toLocaleString()})</li>
          <li>ถอนธนาคารขั้นต่ำ {mockDb.WRITER_POLICY.minimum_payout} Diamond · หรือแลก Gold 1:1</li>
          <li>Gold ของผู้อ่านคืนเงินสดไม่ได้</li>
        </ul>
      </div>
    </>
  );
}
