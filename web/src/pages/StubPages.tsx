import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';

export function WriterStubPage() {
  return (
    <>
      <Topbar title="นักเขียน" back="/me" showCoin={false} />
      <div className="pad">
        <div className="card">
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>โครง MVP</h1>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            หน้านักเขียนยังไม่ทำในรอบนี้ — มีแค่โครงตามแผน (ลงทะเบียน, dashboard, แก้ไขเรื่อง/ตอน, รายได้)
            ไม่บล็อกการส่งมอบฝั่งผู้อ่าน
          </p>
          <Link to="/" className="btn btn-primary btn-block mt-3">กลับหน้าแรกผู้อ่าน</Link>
        </div>
      </div>
    </>
  );
}

export function AdminStubPage() {
  return (
    <>
      <Topbar title="แอดมิน" back="/me" showCoin={false} />
      <div className="pad">
        <div className="card">
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>โครง MVP</h1>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            หน้าแอดมินยังไม่ทำในรอบนี้ — มีแค่โครง (ผู้ใช้, อนุมัติ, เนื้อหา, ธุรกรรม, audit)
            HTTP admin routes ฝั่ง backend ก็ยังเป็น design-only
          </p>
          <Link to="/" className="btn btn-primary btn-block mt-3">กลับหน้าแรกผู้อ่าน</Link>
        </div>
      </div>
    </>
  );
}
