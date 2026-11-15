import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/Badge';
import { ThemeToggle } from '../components/ThemeToggle';
import { CoinAmount } from '../components/CoinAmount';
import { mockDb } from '../lib/mock/store';
import {
  decodeProfileSlug,
  profilePathFor,
  profileSlugFor,
  slugsMatch,
} from '../lib/profileSlug';
import type { SessionUser } from '../lib/types';

function initials(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.slice(0, 2);
}

function findAccountUserBySlug(slug: string): SessionUser | null {
  const accounts = mockDb.getState().accounts;
  for (const row of Object.values(accounts)) {
    if (row.deleted) continue;
    if (slugsMatch(profileSlugFor(row.user), slug)) return row.user;
  }
  return null;
}

export function ProfilePage() {
  const { slug: rawSlug } = useParams();
  const slug = decodeProfileSlug(rawSlug ?? '');
  const { user, gold, diamond, tickets, logout, isMock, loading } = useApp();
  const nav = useNavigate();

  const viewed = useMemo(() => {
    if (user && slugsMatch(profileSlugFor(user), slug)) return user;
    return findAccountUserBySlug(slug);
  }, [user, slug]);

  const isOwn = !!(user && viewed && user.id === viewed.id);
  const author = viewed ? mockDb.authorForUser(viewed.id) : undefined;

  async function onLogout() {
    await logout();
    nav('/');
  }

  if (loading) {
    return <div className="pad muted center" style={{ paddingTop: 48 }}>กำลังโหลด…</div>;
  }

  if (!viewed) {
    return (
      <div className="pad center" style={{ paddingTop: 48 }}>
        <p className="mb-3">ไม่พบโปรไฟล์ «{slug}»</p>
        <Link className="btn btn-primary" to={user ? profilePathFor(user) : '/me'}>
          กลับโปรไฟล์ของฉัน
        </Link>
      </div>
    );
  }

  const handle = profileSlugFor(viewed);

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-av" aria-hidden>{initials(viewed.display_name)}</div>
        <h1 className="profile-name">{viewed.display_name}</h1>
        <p className="profile-handle">/{handle}</p>
        {author?.status === 'approved' && (
          <Link to={`/authors/${author.id}`} className="profile-role-chip">
            นักแปล · {author.display_name}
          </Link>
        )}
        {isMock && isOwn && <Badge kind="ex">mock</Badge>}

        {isOwn && (
          <div className="profile-stats" aria-label="ยอดคงเหลือ">
            <div className="profile-stat">
              <span className="profile-stat-label">Gold</span>
              <CoinAmount value={gold} currency="gold" />
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Diamond</span>
              <CoinAmount value={diamond} currency="diamond" />
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">ตั๋ว</span>
              <strong>{tickets}</strong>
            </div>
          </div>
        )}
      </header>

      <div className="pad profile-body">
        {isOwn ? (
          <>
            <div className="profile-theme-row"><ThemeToggle /></div>

            <section className="profile-section">
              <h2 className="profile-section-title">บัญชี</h2>
              <nav className="profile-links">
                <Link to="/me/settings">ตั้งค่าบัญชี</Link>
                <Link to="/wallet">กระเป๋า Gold / Diamond</Link>
                <Link to="/wallet/topup">เติม Gold</Link>
                <Link to="/library">ชั้นหนังสือ</Link>
              </nav>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">กิจกรรม</h2>
              <nav className="profile-links">
                <Link to="/check-in">เช็คอินรายวัน</Link>
                <Link to="/referral">ชวนเพื่อน รับ 7%</Link>
                <Link to="/ranking">อันดับ</Link>
                <Link to="/help">ศูนย์ช่วยเหลือ</Link>
              </nav>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">โซนทำงาน</h2>
              <nav className="profile-links">
                <Link to="/writer">นักเขียน</Link>
                <Link to="/admin">แอดมิน</Link>
              </nav>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">กฎหมาย</h2>
              <nav className="profile-links">
                <Link to="/legal/tos">ข้อกำหนดการใช้</Link>
                <Link to="/legal/privacy">ความเป็นส่วนตัว</Link>
                <Link to="/legal/coins">นโยบายเหรียญ</Link>
                <Link to="/legal/takedown">แจ้งละเมิดลิขสิทธิ์</Link>
              </nav>
            </section>

            <button type="button" className="btn btn-danger btn-block profile-logout" onClick={onLogout}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <section className="profile-section">
            <h2 className="profile-section-title">โปรไฟล์สาธารณะ</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
              {viewed.email.replace(/(.{2}).+(@.+)/, '$1***$2')}
            </p>
            {author?.status === 'approved' ? (
              <Link className="btn btn-primary btn-block" to={`/authors/${author.id}`}>
                ดูผลงานนักแปล
              </Link>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>ยังไม่มีผลงานสาธารณะ</p>
            )}
            {user && (
              <Link className="btn btn-ghost btn-block mt-2" to={profilePathFor(user)}>
                กลับโปรไฟล์ของฉัน
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
