import {
  BRAND_HERO,
  BRAND_LOGO,
  BRAND_LOGO_TOPBAR,
  BRAND_MASCOT,
  COVER_DEFAULT,
  CURRENCY_DIAMOND,
  CURRENCY_GOLD,
} from './brand';

/** Keys managed from admin CMS → ภาพเริ่มต้นของระบบ */
export type SiteAssetKey =
  | 'cover_default'
  | 'hero_fallback'
  | 'logo'
  | 'logo_topbar'
  | 'mascot'
  | 'currency_gold'
  | 'currency_diamond';

export type SiteAssetsMap = Record<SiteAssetKey, string>;

export const SITE_ASSET_META: {
  key: SiteAssetKey;
  label: string;
  hint: string;
  maxEdge: number;
}[] = [
  {
    key: 'cover_default',
    label: 'ปกเรื่องเริ่มต้น',
    hint: 'ใช้เมื่อเรื่องยังไม่มีปก หรือโหลดรูปไม่สำเร็จ',
    maxEdge: 800,
  },
  {
    key: 'hero_fallback',
    label: 'แบนเนอร์สำรอง',
    hint: 'ใช้เมื่อยังไม่มีสไลด์แบนเนอร์ที่เปิดใช้งาน',
    maxEdge: 1920,
  },
  {
    key: 'logo',
    label: 'โลโก้หลัก',
    hint: 'โลโก้ทั่วไปในแอป',
    maxEdge: 512,
  },
  {
    key: 'logo_topbar',
    label: 'โลโก้ Topbar',
    hint: 'โลโก้แถบนำทางด้านบน',
    maxEdge: 512,
  },
  {
    key: 'mascot',
    label: 'มาสคอต',
    hint: 'ตัวละครแบรนด์ (เช่น หน้าโปรไฟล์เกสต์ / ฟุตเตอร์)',
    maxEdge: 800,
  },
  {
    key: 'currency_gold',
    label: 'ไอคอน Gold',
    hint: 'รูปเหรียญ Gold ในยอดคงเหลือและกระเป๋า',
    maxEdge: 256,
  },
  {
    key: 'currency_diamond',
    label: 'ไอคอน Diamond',
    hint: 'รูปเพชร Diamond ในยอดคงเหลือและกระเป๋า',
    maxEdge: 256,
  },
];

export const SITE_ASSET_DEFAULTS: SiteAssetsMap = {
  cover_default: COVER_DEFAULT,
  hero_fallback: BRAND_HERO,
  logo: BRAND_LOGO,
  logo_topbar: BRAND_LOGO_TOPBAR,
  mascot: BRAND_MASCOT,
  currency_gold: CURRENCY_GOLD,
  currency_diamond: CURRENCY_DIAMOND,
};

export function mergeSiteAssets(partial?: Partial<SiteAssetsMap> | null): SiteAssetsMap {
  return {
    ...SITE_ASSET_DEFAULTS,
    ...(partial ?? {}),
  };
}
