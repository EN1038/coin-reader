import { blobToDataUrl, optimizeImageFile } from './optimizeImage';

/** Resize/compress an avatar — accepts any image/*, keeps animation when present. */
export async function compressAvatarFile(file: File, maxEdge = 512, quality = 0.85): Promise<Blob> {
  const out = await optimizeImageFile(file, {
    maxEdge,
    quality,
    maxBytes: 350_000,
  });
  return out.blob;
}

export { blobToDataUrl };

export function profileInitials(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  return t.slice(0, 2);
}
