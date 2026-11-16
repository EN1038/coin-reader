import { Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BrandMascot } from '../components/BrandAssets';
import { ThemeToggle } from '../components/ThemeToggle';
import { IconChevronRight } from '../components/icons';
import { profilePathFor } from '../lib/profileSlug';

/** /me → ไป /u/ชื่อ เมื่อล็อกอินแล้ว · ถ้ายังไม่ล็อกอินแสดงเกสต์ฮับ */
export function MePage() {
  const { user, loading } = useApp();

  if (loading) {
    return <div className="pad muted center" style={{ paddingTop: 48 }}>กำลังโหลด…</div>;
  }

  if (user) {
    return <Navigate to={profilePathFor(user)} replace />;
  }

  return (
    <div className="profile-page">
      <div className="profile-hero profile-hero-guest">
        <BrandMascot size="md" className="me-guest-mascot" />
        <h1>โปรไฟล์</h1>
        <p className="profile-hero-sub">เข้าสู่ระบบเพื่อเปิดหน้าโปรไฟล์เป็นชื่อของคุณ</p>
        <div className="profile-hero-actions">
          <Link to="/auth/login?next=/me" className="btn btn-primary">เข้าสู่ระบบ</Link>
          <Link to="/auth/signup" className="btn btn-ghost profile-btn-on-hero">สมัครสมาชิก</Link>
        </div>
      </div>

      <div className="pad profile-body">
        <div className="profile-theme-row"><ThemeToggle /></div>
        <section className="profile-section">
          <h2 className="profile-section-title">สำรวจ</h2>
          <nav className="profile-links">
            <Link to="/library" className="profile-link profile-link-plain">ชั้นหนังสือ <IconChevronRight size={18} className="profile-link-chev" /></Link>
            <Link to="/check-in" className="profile-link profile-link-plain">เช็คอินรายวัน <IconChevronRight size={18} className="profile-link-chev" /></Link>
            <Link to="/ranking" className="profile-link profile-link-plain">อันดับ <IconChevronRight size={18} className="profile-link-chev" /></Link>
            <Link to="/help" className="profile-link profile-link-plain">ศูนย์ช่วยเหลือ <IconChevronRight size={18} className="profile-link-chev" /></Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
