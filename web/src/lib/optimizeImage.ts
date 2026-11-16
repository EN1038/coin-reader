/** Client-side image normalize: accept any image/*, store smallest practical format, keep animation. */

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export type OptimizeImageOptions = {
  /** Longest edge after resize (static only). Default 1600 */
  maxEdge?: number;
  /** Soft target size; quality steps down until under this when possible */
  maxBytes?: number;
  /** Starting quality for lossy encode (0–1). Default 0.82 */
  quality?: number;
};

export type OptimizedImage = {
  blob: Blob;
  dataUrl: string;
  mime: 'image/webp' | 'image/jpeg' | 'image/png' | 'image/gif';
  animated: boolean;
  width: number;
  height: number;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    };
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

/** GIF with >1 image descriptor, or WebP with ANIM/ANMF chunk */
export async function detectAnimatedImage(file: Blob): Promise<boolean> {
  const probeSize = Math.min(file.size, 1024 * 1024);
  const buf = new Uint8Array(await file.slice(0, probeSize).arrayBuffer());
  if (buf.length < 12) return false;

  const isGif =
    file.type === 'image/gif'
    || (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46);
  if (isGif) {
    let frames = 0;
    for (let i = 0; i < buf.length; i += 1) {
      if (buf[i] === 0x2c) frames += 1;
      if (frames > 1) return true;
    }
    return false;
  }

  const isWebp =
    file.type === 'image/webp'
    || (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
      && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50);
  if (isWebp) {
    const text = new TextDecoder('latin1').decode(buf);
    return text.includes('ANIM') || text.includes('ANMF');
  }

  return false;
}

function supportsWebpEncode(): boolean {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

async function encodeStatic(
  file: Blob,
  maxEdge: number,
  quality: number,
  maxBytes: number,
): Promise<{ blob: Blob; mime: OptimizedImage['mime']; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('ไม่สามารถประมวลผลรูปได้');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const canWebp = supportsWebpEncode();
  const qualities = [quality, 0.75, 0.65, 0.55, 0.45].filter((q, i, arr) => arr.indexOf(q) === i);

  let best: { blob: Blob; mime: OptimizedImage['mime'] } | null = null;

  for (const q of qualities) {
    const candidates: { blob: Blob; mime: OptimizedImage['mime'] }[] = [];
    if (canWebp) {
      const webp = await canvasToBlob(canvas, 'image/webp', q);
      if (webp) candidates.push({ blob: webp, mime: 'image/webp' });
    }
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', q);
    if (jpeg) candidates.push({ blob: jpeg, mime: 'image/jpeg' });

    if (!candidates.length) continue;
    candidates.sort((a, b) => a.blob.size - b.blob.size);
    const pick = candidates[0];
    if (!best || pick.blob.size < best.blob.size) best = pick;
    if (pick.blob.size <= maxBytes) break;
  }

  if (!best) throw new Error('ไม่สามารถแปลงรูปได้');
  return { ...best, width, height };
}

/**
 * Accept any image/* upload, then:
 * - animated GIF/WebP → keep animation (store original, capped by size)
 * - static → resize + pick smallest of WebP/JPEG
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<OptimizedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG, WebP, GIF, …)');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('ไฟล์ใหญ่เกินไป (สูงสุด 12MB)');
  }

  const maxEdge = options.maxEdge ?? 1600;
  const maxBytes = options.maxBytes ?? 900_000;
  const quality = options.quality ?? 0.82;
  const animated = await detectAnimatedImage(file);

  if (animated) {
    // Canvas would flatten frames — keep animated original (already often small as GIF/WebP)
    if (file.size > maxBytes * 2) {
      throw new Error('ภาพเคลื่อนไหวใหญ่เกินไป กรุณาใช้ไฟล์ที่เล็กกว่า');
    }
    const mime = (file.type === 'image/gif' || file.type === 'image/webp'
      ? file.type
      : 'image/gif') as OptimizedImage['mime'];
    const blob = file.slice(0, file.size, mime);
    const dataUrl = await blobToDataUrl(blob);
    let width = 0;
    let height = 0;
    try {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      bmp.close();
    } catch {
      /* ignore */
    }
    return { blob, dataUrl, mime, animated: true, width, height };
  }

  const encoded = await encodeStatic(file, maxEdge, quality, maxBytes);
  const dataUrl = await blobToDataUrl(encoded.blob);
  return {
    blob: encoded.blob,
    dataUrl,
    mime: encoded.mime,
    animated: false,
    width: encoded.width,
    height: encoded.height,
  };
}

export { blobToDataUrl };
