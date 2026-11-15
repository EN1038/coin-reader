import type { SessionUser } from './types';

/** URL handle จากชื่อที่แสดง — เก็บอักษรไทย/อังกฤษ เว้นวรรคเป็น - */
export function slugifyProfileName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0e00-\u0e7f-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'user';
}

/** สร้าง slug โปรไฟล์ — ใช้ชื่อคนเป็นหลัก */
export function profileSlugFor(user: Pick<SessionUser, 'id' | 'email' | 'display_name'>): string {
  const fromName = slugifyProfileName(user.display_name);
  if (fromName && fromName !== 'user') return fromName;
  const local = user.email.split('@')[0] ?? '';
  const fromEmail = slugifyProfileName(local);
  if (fromEmail && fromEmail !== 'user') return fromEmail;
  return user.id.slice(0, 8);
}

export function profilePathFor(user: Pick<SessionUser, 'id' | 'email' | 'display_name'>): string {
  return `/u/${encodeURIComponent(profileSlugFor(user))}`;
}

export function decodeProfileSlug(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

export function slugsMatch(a: string, b: string): boolean {
  return a.normalize('NFC') === b.normalize('NFC')
    || a.toLowerCase() === b.toLowerCase();
}
