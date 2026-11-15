import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
import {
  IconBook,
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconCoin,
  IconGift,
  IconSearch,
  IconShelf,
  IconTrophy,
  IconUser,
} from '../components/icons';
import type { ReactNode } from 'react';

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

function ProfileLink({
  to,
  icon,
  label,
  hint,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link to={to} className="profile-link">
      <span className="profile-link-ic" aria-hidden>{icon}</span>
      <span className="profile-link-copy">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <IconChevronRight size={18} className="profile-link-chev" />
    </Link>
  );
}

export function ProfilePage() {
  const { slug: rawSlug } = useParams();
  const slug = decodeProfileSlug(rawSlug ?? '');
  const { user, gold, diamond, tickets, logout, loading } = useApp();
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
        <div className="profile-hero-inner">
          <div className="profile-id">
            <div className="profile-av" aria-hidden>{initials(viewed.display_name)}</div>
            <div className="profile-id-copy">
              <h1 className="profile-name">{viewed.display_name}</h1>
              <p className="profile-handle">/{handle}</p>
              {author?.status === 'approved' && (
                <Link to={`/authors/${author.id}`} className="profile-role-chip">
                  นักแปล
                </Link>
              )}
            </div>
          </div>

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
        </div>
      </header>

      <div className="profile-sheet">
        {isOwn ? (
          <>
            <div className="profile-sheet-top">
              <ThemeToggle />
            </div>

            <nav className="profile-quick" aria-label="ทางลัด">
              <Link to="/library" className="profile-quick-item">
                <IconShelf size={20} />
                <span>ชั้นหนังสือ</span>
              </Link>
              <Link to="/library?tab=history" className="profile-quick-item">
                <IconClock size={20} />
                <span>ประวัติอ่าน</span>
              </Link>
              <Link to="/wallet/topup" className="profile-quick-item">
                <IconCoin size={20} />
                <span>เติม Gold</span>
              </Link>
              <Link to="/check-in" className="profile-quick-item">
                <IconCalendar size={20} />
                <span>เช็คอิน</span>
              </Link>
            </nav>

            <section className="profile-section">
              <h2 className="profile-section-title">บัญชี</h2>
              <nav className="profile-links">
                <ProfileLink to="/me/settings" icon={<IconUser size={18} />} label="ตั้งค่าบัญชี" hint="ชื่อ · ความปลอดภัย" />
                <ProfileLink to="/wallet" icon={<IconCoin size={18} />} label="กระเป๋า Gold / Diamond" hint="ยอดคงเหลือและประวัติ" />
                <ProfileLink to="/library" icon={<IconShelf size={18} />} label="ชั้นหนังสือ" hint="เรื่องที่ติดตาม" />
                <ProfileLink to="/library?tab=history" icon={<IconClock size={18} />} label="ประวัติการอ่าน" hint="ตอนที่ค้างไว้ · อ่านต่อ" />
              </nav>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">กิจกรรม</h2>
              <nav className="profile-links">
                <ProfileLink to="/check-in" icon={<IconCalendar size={18} />} label="เช็คอินรายวัน" />
                <ProfileLink to="/referral" icon={<IconGift size={18} />} label="ชวนเพื่อน" hint="รับ 7%" />
                <ProfileLink to="/ranking" icon={<IconTrophy size={18} />} label="อันดับ" />
                <ProfileLink to="/help" icon={<IconSearch size={18} />} label="ศูนย์ช่วยเหลือ" />
              </nav>
            </section>

            <section className="profile-section">
              <h2 className="profile-section-title">โซนทำงาน</h2>
              <nav className="profile-links">
                <ProfileLink to="/writer" icon={<IconBook size={18} />} label="นักเขียน" hint="ผลงาน · ตอน · ถอน Diamond" />
                <ProfileLink to="/admin" icon={<IconUser size={18} />} label="แอดมิน" hint="CMS · คิวอนุมัติ" />
              </nav>
            </section>

            <section className="profile-section profile-legal">
              <h2 className="profile-section-title">กฎหมาย</h2>
              <div className="profile-legal-links">
                <Link to="/legal/tos">ข้อกำหนด</Link>
                <Link to="/legal/privacy">ความเป็นส่วนตัว</Link>
                <Link to="/legal/coins">นโยบายเหรียญ</Link>
                <Link to="/legal/takedown">แจ้งละเมิด</Link>
              </div>
            </section>

            <button type="button" className="profile-logout" onClick={onLogout}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <section className="profile-section" style={{ marginTop: 0 }}>
            <h2 className="profile-section-title">โปรไฟล์สาธารณะ</h2>
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
