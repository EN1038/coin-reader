import { ApiError } from '../types';
import type { Chapter, SessionUser } from '../types';
import { mockDb } from './store';
import type { CoinReaderApi } from '../api';

function requireUser(): SessionUser {
  const u = mockDb.getState().user;
  if (!u) throw new ApiError(401, 'UNAUTHORIZED');
  return u;
}

function canReadChapter(userId: string | undefined, chapter: Chapter): boolean {
  if (chapter.pricing === 'free') return true;
  return mockDb.isUnlocked(userId, chapter.id);
}

/** SVG placeholder as data URL — richer comic-panel look for demo scroll */
function placeholderPageUrl(label: string, page: number, wm: string): string {
  const title = escapeXml(label);
  const wmark = escapeXml(wm);
  const bubble =
    page === 1
      ? 'ที่นี่คือไหน…'
      : page === 2
        ? 'แผนที่เปียกฝน'
        : 'ไปต่อไหม?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1200" viewBox="0 0 780 1200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#121820"/><stop offset="100%" stop-color="#0B1018"/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1A2433"/><stop offset="100%" stop-color="#141C28"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <text x="40" y="36" fill="#7A93B5" font-family="sans-serif" font-size="14" font-weight="600">Twilight Blue · ตัวอย่างมังงะ</text>
    <text x="740" y="36" fill="#5A6B82" font-family="sans-serif" font-size="13" text-anchor="end">หน้า ${page}/3</text>
    <text x="40" y="62" fill="#C5D4E8" font-family="sans-serif" font-size="18" font-weight="700">${title}</text>

    <!-- top wide panel -->
    <rect x="36" y="84" width="708" height="320" rx="10" fill="url(#panel)" stroke="#3D5A80" stroke-width="2"/>
    <circle cx="180" cy="220" r="48" fill="#2A3A52" stroke="#6B8BB5" stroke-width="2"/>
    <circle cx="168" cy="208" r="6" fill="#9BB6D4"/><circle cx="192" cy="208" r="6" fill="#9BB6D4"/>
    <path d="M165 235 Q180 248 195 235" fill="none" stroke="#9BB6D4" stroke-width="3"/>
    <rect x="280" y="160" width="420" height="160" rx="8" fill="#101820" stroke="#2C3E55"/>
    <text x="300" y="210" fill="#8FA6C4" font-family="sans-serif" font-size="16">ฉากกว้าง · หาด / ซอย / เมืองสมมติ</text>
    <text x="300" y="240" fill="#5E738F" font-family="sans-serif" font-size="13">แผงตัวอย่างสำหรับเลื่อนอ่านแนวตั้ง</text>

    <!-- speech bubble on top panel -->
    <rect x="420" y="100" width="200" height="52" rx="16" fill="#F3F6FA" stroke="#3D5A80"/>
    <polygon points="450,152 470,152 455,170" fill="#F3F6FA" stroke="#3D5A80"/>
    <text x="520" y="132" fill="#1A2433" font-family="sans-serif" font-size="15" text-anchor="middle" font-weight="600">${escapeXml(bubble)}</text>

    <!-- mid left -->
    <rect x="36" y="424" width="340" height="280" rx="10" fill="url(#panel)" stroke="#3D5A80" stroke-width="2"/>
    <rect x="70" y="460" width="270" height="140" rx="8" fill="#0E1520" stroke="#2C3E55"/>
    <text x="205" y="535" fill="#7A93B5" font-family="sans-serif" font-size="14" text-anchor="middle">โคลสอัปตัวละคร</text>
    <rect x="90" y="620" width="160" height="44" rx="14" fill="#F3F6FA"/>
    <text x="170" y="648" fill="#1A2433" font-family="sans-serif" font-size="13" text-anchor="middle">…ได้ยินไหม</text>

    <!-- mid right -->
    <rect x="404" y="424" width="340" height="280" rx="10" fill="url(#panel)" stroke="#3D5A80" stroke-width="2"/>
    <path d="M430 480 L720 480 L720 650 L430 650 Z" fill="#0E1520" stroke="#2C3E55"/>
    <circle cx="575" cy="560" r="36" fill="#243246" stroke="#6B8BB5"/>
    <text x="575" y="680" fill="#5E738F" font-family="sans-serif" font-size="13" text-anchor="middle">แผงปฏิกิริยา</text>

    <!-- bottom full -->
    <rect x="36" y="724" width="708" height="360" rx="10" fill="url(#panel)" stroke="#3D5A80" stroke-width="2"/>
    <rect x="70" y="760" width="640" height="200" rx="8" fill="#0E1520" stroke="#2C3E55"/>
    <text x="390" y="850" fill="#8FA6C4" font-family="sans-serif" font-size="18" text-anchor="middle">ฉากต่อ · หน้า ${page}</text>
    <text x="390" y="885" fill="#5E738F" font-family="sans-serif" font-size="14" text-anchor="middle">SVG จำลองแผงมังงะ · ไม่ใช่ภาพลิขสิทธิ์จริง</text>
    <rect x="250" y="920" width="280" height="48" rx="16" fill="#F3F6FA"/>
    <text x="390" y="950" fill="#1A2433" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="600">พลิกหน้าถัดไปได้</text>

    <text x="390" y="1120" fill="rgba(197,212,232,0.12)" font-family="sans-serif" font-size="26" text-anchor="middle"
      transform="rotate(-24 390 980)">uid:${wmark} · Twilight Blue</text>
    <text x="390" y="1175" fill="#4A5D75" font-family="sans-serif" font-size="13" text-anchor="middle">ตัวอย่างสำหรับพรีเซนต์ · watermark mock</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const mockApi: CoinReaderApi = {
  isMock: true,

  async getSession() {
    return mockDb.getState().user;
  },

  async login(email, password) {
    try {
      return mockDb.login(email, password);
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  },

  async signup(email, password, displayName) {
    try {
      return mockDb.signup(email, password, displayName);
    } catch (e) {
      if (e instanceof Error && e.message === 'EMAIL_TAKEN') {
        throw new ApiError(409, 'VALIDATION', 'อีเมลนี้ถูกใช้แล้ว');
      }
      throw e;
    }
  },

  async logout() {
    mockDb.logout();
  },

  async listWorks(params) {
    let list = [...mockDb.works];
    if (params?.kind) list = list.filter((w) => w.kind === params.kind);
    if (params?.category && params.category !== 'ทั้งหมด') {
      list = list.filter((w) => w.category === params.category || w.tags.includes(params.category!));
    }
    if (params?.q) {
      const q = params.q.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.author_name.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (params?.popular) list = list.filter((w) => w.popular);
    if (params?.isNew) list = list.filter((w) => w.is_new);
    if (params?.featured) list = list.filter((w) => w.featured);
    return list;
  },

  async getWorkBySlug(slug) {
    const w = mockDb.works.find((x) => x.slug === slug || x.id === slug);
    if (!w) throw new ApiError(404, 'NOT_FOUND');
    return w;
  },

  async getWork(id) {
    const w = mockDb.works.find((x) => x.id === id);
    if (!w) throw new ApiError(404, 'NOT_FOUND');
    return w;
  },

  async listChapters(workId) {
    return mockDb.chapters
      .filter((c) => c.work_id === workId)
      .sort((a, b) => a.number - b.number);
  },

  async getChapter(chapterId) {
    const c = mockDb.chapters.find((x) => x.id === chapterId);
    if (!c) throw new ApiError(404, 'NOT_FOUND');
    return c;
  },

  async getChapterContent(chapterId) {
    const chapter = await this.getChapter(chapterId);
    const user = mockDb.getState().user;
    if (!canReadChapter(user?.id, chapter)) {
      throw new ApiError(403, 'UNAUTHORIZED', 'ยังไม่ได้ปลดล็อกตอนนี้');
    }
    const body = mockDb.contents.find((c) => c.chapter_id === chapterId);
    if (!body) throw new ApiError(404, 'NOT_FOUND');
    return body;
  },

  async listPacks() {
    return mockDb.packs.filter((p) => p.active);
  },

  async myWallet() {
    const u = requireUser();
    return { balance: mockDb.balanceOf(u.id) };
  },

  async listLedger() {
    requireUser();
    return [...mockDb.getState().ledger];
  },

  async mockTopup(packId, idempotencyKey) {
    const u = requireUser();
    if (!idempotencyKey || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      throw new ApiError(400, 'VALIDATION', 'Idempotency-Key ต้องเป็น UUID');
    }
    const pack = mockDb.packs.find((p) => p.id === packId && p.active);
    if (!pack) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบแพ็ก');

    const key = `${u.id}|${idempotencyKey}`;
    const prev = mockDb.getState().topupKeys[key];
    if (prev) {
      if (prev.pack_id !== packId) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT');
      return {
        transaction_id: prev.transaction_id,
        balance: mockDb.balanceOf(u.id),
        coins_added: prev.coins,
        replayed: true,
      };
    }

    const tx = mockDb.newTxId();
    const bal = mockDb.balanceOf(u.id) + pack.coins;
    mockDb.setBalance(u.id, bal);
    mockDb.getState().topupKeys[key] = { pack_id: packId, transaction_id: tx, coins: pack.coins };
    mockDb.addLedger({
      kind: 'topup',
      amount: pack.coins,
      coins: pack.coins,
      label: `เติม ${pack.coins} เหรียญ (mock)`,
      transaction_id: tx,
    });
    mockDb.persist();
    return { transaction_id: tx, balance: bal, coins_added: pack.coins, replayed: false };
  },

  async unlockChapter(input) {
    const u = requireUser();
    if (input.chapter_id && input.work_id) {
      throw new ApiError(400, 'VALIDATION', 'ส่ง chapter_id หรือ work_id อย่างเดียว');
    }
    if (!input.chapter_id && !input.work_id) {
      throw new ApiError(400, 'VALIDATION', 'ต้องมี chapter_id หรือ work_id');
    }

    if (input.work_id) {
      const work = mockDb.works.find((w) => w.id === input.work_id);
      if (!work || work.price_full_work == null) throw new ApiError(404, 'NOT_FOUND');
      if (input.expected_price !== work.price_full_work) {
        throw new ApiError(409, 'PRICE_CHANGED', undefined, { current_price: work.price_full_work });
      }
      if (mockDb.hasWorkPurchase(u.id, work.id)) {
        return { already: true, balance: mockDb.balanceOf(u.id), work_id: work.id };
      }
      const paidChapters = mockDb.chapters.filter((c) => c.work_id === work.id && c.pricing === 'coin');
      const alreadyPartial = paidChapters.some((c) => mockDb.isUnlocked(u.id, c.id));
      if (alreadyPartial) {
        throw new ApiError(409, 'VALIDATION', 'PARTIAL_OWNERSHIP — เคยซื้อรายตอนแล้ว ไม่รองรับใน MVP');
      }
      const bal = mockDb.balanceOf(u.id);
      if (bal < work.price_full_work) {
        throw new ApiError(409, 'INSUFFICIENT_COINS', undefined, { balance: bal, price: work.price_full_work });
      }
      const tx = mockDb.newTxId();
      const next = bal - work.price_full_work;
      mockDb.setBalance(u.id, next);
      mockDb.addWorkPurchase(u.id, work.id, tx);
      for (const c of paidChapters) {
        mockDb.addUnlock({ user_id: u.id, chapter_id: c.id, work_id: work.id, transaction_id: tx, free: false });
      }
      mockDb.addLedger({
        kind: 'unlock_work',
        amount: -work.price_full_work,
        coins: work.price_full_work,
        label: `ซื้อทั้งเล่ม · ${work.title}`,
        transaction_id: tx,
      });
      return { transaction_id: tx, balance: next, work_id: work.id };
    }

    const chapter = mockDb.chapters.find((c) => c.id === input.chapter_id);
    if (!chapter) throw new ApiError(404, 'NOT_FOUND');
    if (chapter.pricing === 'free') {
      return { free: true, balance: mockDb.balanceOf(u.id), chapter_id: chapter.id };
    }
    if (input.expected_price !== chapter.coin_price) {
      throw new ApiError(409, 'PRICE_CHANGED', undefined, { current_price: chapter.coin_price });
    }
    if (mockDb.isUnlocked(u.id, chapter.id)) {
      return { already: true, balance: mockDb.balanceOf(u.id), chapter_id: chapter.id };
    }
    const bal = mockDb.balanceOf(u.id);
    if (bal < chapter.coin_price) {
      throw new ApiError(409, 'INSUFFICIENT_COINS', undefined, { balance: bal, price: chapter.coin_price });
    }
    const tx = mockDb.newTxId();
    const next = bal - chapter.coin_price;
    mockDb.setBalance(u.id, next);
    mockDb.addUnlock({
      user_id: u.id,
      chapter_id: chapter.id,
      work_id: chapter.work_id,
      transaction_id: tx,
      free: false,
    });
    const work = mockDb.works.find((w) => w.id === chapter.work_id);
    mockDb.addLedger({
      kind: 'unlock',
      amount: -chapter.coin_price,
      coins: chapter.coin_price,
      label: `ปลดล็อกตอนที่ ${chapter.number} · ${work?.title ?? ''}`,
      transaction_id: tx,
    });
    return { transaction_id: tx, balance: next, chapter_id: chapter.id };
  },

  async getMangaPageUrl(chapterId, pageNumber) {
    const chapter = mockDb.chapters.find((c) => c.id === chapterId);
    if (!chapter) throw new ApiError(404, 'NOT_FOUND');
    const user = mockDb.getState().user;
    if (!canReadChapter(user?.id, chapter)) {
      throw new ApiError(403, 'UNAUTHORIZED', 'ยังไม่ได้ปลดล็อกตอนนี้');
    }
    const page = mockDb.pages.find((p) => p.chapter_id === chapterId && p.page_number === pageNumber);
    if (!page) throw new ApiError(404, 'NOT_FOUND');
    const work = mockDb.works.find((w) => w.id === chapter.work_id);
    const wm = user?.watermark_id ?? 'guest';
    return {
      page_number: pageNumber,
      url: placeholderPageUrl(`${work?.title ?? ''} · ตอน ${chapter.number}`, pageNumber, wm),
      expires_in: 120,
      watermarked: false,
    };
  },

  async listBookshelf() {
    const u = requireUser();
    return mockDb.getState().bookshelf.filter((b) => b.user_id === u.id);
  },

  async toggleBookshelf(workId) {
    const u = requireUser();
    return mockDb.toggleBookshelf(u.id, workId);
  },

  async inBookshelf(workId) {
    const u = mockDb.getState().user;
    return mockDb.inBookshelf(u?.id, workId);
  },

  async listHistory() {
    const u = requireUser();
    return mockDb
      .getState()
      .progress.filter((p) => p.user_id === u.id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  async saveProgress(workId, chapterId, position) {
    const u = requireUser();
    mockDb.setProgress(u.id, workId, chapterId, position);
  },

  async isChapterUnlocked(chapterId) {
    const chapter = mockDb.chapters.find((c) => c.id === chapterId);
    if (!chapter) return false;
    if (chapter.pricing === 'free') return true;
    const u = mockDb.getState().user;
    return mockDb.isUnlocked(u?.id, chapterId);
  },
};
