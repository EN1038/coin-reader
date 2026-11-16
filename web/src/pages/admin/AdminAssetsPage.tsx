import { useRef, useState } from 'react';
import { AdminPageHeader } from '../../components/AdminModal';
import { errMessage } from '../../context/AppContext';
import { useSiteAssets } from '../../context/SiteAssetsContext';
import { optimizeImageFile } from '../../lib/optimizeImage';
import { SITE_ASSET_DEFAULTS, SITE_ASSET_META, type SiteAssetKey } from '../../lib/siteAssets';

export function AdminAssetsPage() {
  const { assets, setAsset, resetAsset, refresh } = useSiteAssets();
  const [busyKey, setBusyKey] = useState<SiteAssetKey | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const inputRefs = useRef<Partial<Record<SiteAssetKey, HTMLInputElement | null>>>({});

  async function onUpload(key: SiteAssetKey, file: File | undefined) {
    if (!file) return;
    setError('');
    setMsg('');
    setBusyKey(key);
    try {
      const meta = SITE_ASSET_META.find((m) => m.key === key);
      const out = await optimizeImageFile(file, {
        maxEdge: meta?.maxEdge ?? 1200,
        maxBytes: key.startsWith('currency') ? 180_000 : 900_000,
        quality: 0.84,
      });
      await setAsset(key, out.dataUrl);
      setMsg(`บันทึก «${meta?.label ?? key}» แล้ว`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusyKey(null);
    }
  }

  async function onReset(key: SiteAssetKey) {
    const meta = SITE_ASSET_META.find((m) => m.key === key);
    if (!window.confirm(`รีเซ็ต «${meta?.label ?? key}» กลับเป็นรูปค่าเริ่มต้นของระบบ?`)) return;
    setBusyKey(key);
    setError('');
    setMsg('');
    try {
      await resetAsset(key);
      setMsg(`รีเซ็ต «${meta?.label ?? key}» แล้ว`);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="ภาพเริ่มต้น"
        desc="จัดการรูป default ของระบบ — ปกเรื่อง · แบนเนอร์สำรอง · โลโก้ · มาสคอต · ไอคอนเหรียญ"
        action={
          <button type="button" className="btn btn-ghost" onClick={() => { void refresh(); }}>
            รีเฟรช
          </button>
        }
      />

      {msg && <p className="admin-assets-msg ok">{msg}</p>}
      {error && <p className="admin-assets-msg err">{error}</p>}

      <div className="admin-assets-grid">
        {SITE_ASSET_META.map((item) => {
          const src = assets[item.key] || SITE_ASSET_DEFAULTS[item.key];
          const busy = busyKey === item.key;
          const isCustom = src !== SITE_ASSET_DEFAULTS[item.key];
          return (
            <article key={item.key} className="admin-asset-card">
              <div className={`admin-asset-preview${item.key.startsWith('currency') ? ' sm' : ''}`}>
                <img src={src} alt="" />
              </div>
              <div className="admin-asset-copy">
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
                <small className="muted">{isCustom ? 'กำหนดเองจาก CMS' : 'ใช้ไฟล์เริ่มต้นของโปรเจกต์'}</small>
              </div>
              <div className="admin-asset-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => inputRefs.current[item.key]?.click()}
                >
                  {busy ? 'กำลังแปลง…' : 'อัปโหลด'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy || !isCustom}
                  onClick={() => { void onReset(item.key); }}
                >
                  รีเซ็ต
                </button>
                <input
                  ref={(el) => { inputRefs.current[item.key] = el; }}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    void onUpload(item.key, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
