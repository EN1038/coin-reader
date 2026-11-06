import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Badge } from '../components/Badge';
import { MockBanner } from '../components/MockBanner';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { mockDb } from '../lib/mock/store';
import { isMockMode } from '../lib/supabase';

function initials(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.slice(0, 2);
}

export function SettingsPage() {
  const { user, refresh, isMock, logout } = useApp();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.display_name ?? '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (!user) {
    return (
      <>
        <Topbar title="ตั้งค่าบัญชี" back="/me" showCoin={false} />
        <div className="pad form-narrow">
          <div className="card center">
            <p className="mb-3">กรุณาเข้าสู่ระบบก่อนตั้งค่าบัญชี</p>
            <Link to="/auth/login?next=/me/settings" className="btn btn-primary btn-block">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </>
    );
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!isMockMode) {
      setError('แก้ไขชื่อได้ในโหมด mock เท่านั้นตอนนี้');
      return;
    }
    try {
      mockDb.updateDisplayName(name);
      await refresh();
      setMsg('บันทึกแล้ว');
      setEditing(false);
    } catch {
      setError('บันทึกไม่สำเร็จ');
    }
  }

  async function onLogout() {
    await logout();
    nav('/');
  }

  return (
    <>
      <Topbar title="ตั้งค่าบัญชี" back="/me" showCoin={false} />
      {isMock && (
        <div className="pad" style={{ paddingBottom: 0 }}>
          <MockBanner>ตั้งค่าบน mock / localStorage</MockBanner>
        </div>
      )}

      <div className="settings-profile">
        <div className="settings-av">{initials(user.display_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <form onSubmit={saveName}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={40}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, minHeight: 40 }}>บันทึก</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1, minHeight: 40 }} onClick={() => { setEditing(false); setName(user.display_name); }}>ยกเลิก</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{user.display_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
              {isMock && <Badge kind="ex" >บัญชีตัวอย่าง</Badge>}
            </>
          )}
          {msg && <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6 }}>{msg}</div>}
          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
        </div>
        {!editing && (
          <button type="button" className="btn btn-ghost" style={{ minHeight: 36, padding: '0 10px', color: 'var(--text-muted)' }} onClick={() => setEditing(true)}>
            แก้ไข
          </button>
        )}
      </div>

      <div className="sec" style={{ paddingTop: 0 }}>
        <h2 style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>การแสดงผล</h2>
      </div>
      <div className="settings-group">
        <div className="item">
          <div>
            ธีมสว่าง / มืด
            <div className="sub">ตอนนี้: {theme === 'dark' ? 'มืด' : 'สว่าง'} (UI)</div>
          </div>
          <button
            type="button"
            className={`settings-toggle${theme === 'light' ? ' on' : ''}`}
            aria-label="สลับธีม"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          />
        </div>
        <div className="item">
          <div>
            ธีมหน้าอ่าน
            <div className="sub">MVP: ตามธีมแอป</div>
          </div>
          <span className="r">{theme === 'dark' ? 'มืด' : 'สว่าง'} →</span>
        </div>
      </div>

      <div className="sec">
        <h2 style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>กฎหมายและสิทธิ</h2>
      </div>
      <div className="settings-group">
        <Link to="/legal/tos" className="item">ข้อกำหนดการใช้ <span className="r">→</span></Link>
        <Link to="/legal/privacy" className="item">นโยบายความเป็นส่วนตัว <span className="r">→</span></Link>
        <Link to="/legal/coins" className="item">นโยบายเหรียญ (คืนไม่ได้) <span className="r">→</span></Link>
        <Link to="/help" className="item">ศูนย์ช่วยเหลือ / รายงานปัญหา <span className="r">→</span></Link>
      </div>

      <div className="sec">
        <h2 style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>PDPA สั้น ๆ</h2>
      </div>
      <div className="settings-pdpa">
        <strong>สิทธิของเจ้าของข้อมูล (สรุป)</strong>
        <ul>
          <li>เข้าถึง / ขอสำเนาข้อมูลบัญชีที่เก็บ</li>
          <li>แก้ไขข้อมูลไม่ถูกต้อง</li>
          <li>ขอให้ลบหรือระงับเมื่อเข้าเงื่อนไข</li>
          <li>ถอนความยินยอมบางประเภท (ถ้ามีการขอ)</li>
        </ul>
        <div style={{ marginTop: 10 }}>
          ติดต่อ: <span style={{ textDecoration: 'underline' }}>privacy@example.com</span> (ที่อยู่ตัวอย่าง) · รายละเอียดเต็มใน{' '}
          <Link to="/legal/privacy" style={{ color: 'var(--primary)' }}>นโยบายความเป็นส่วนตัว</Link>
        </div>
      </div>

      <div className="sec">
        <h2 style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 500 }}>โซนอันตราย</h2>
      </div>
      <div className="settings-group">
        <Link to="/me/settings/delete" className="item" style={{ color: 'var(--danger)' }}>
          ลบบัญชี / ปิดการใช้งาน
          <span className="r" style={{ color: 'var(--danger)' }}>→</span>
        </Link>
      </div>

      <div style={{ padding: '4px 16px 8px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
        การลบจะปิดการเข้าถึงชั้นหนังสือและประวัติ ·{' '}
        <strong style={{ color: 'var(--text)' }}>เหรียญคงเหลือคืนเป็นเงินสดไม่ได้</strong> ตามนโยบาย
      </div>
      <div style={{ padding: '0 16px 28px' }}>
        <button type="button" className="btn btn-ghost btn-block" onClick={onLogout}>ออกจากระบบ</button>
      </div>
    </>
  );
}
