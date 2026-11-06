import type {
  SessionUser, UnlockRecord, BookshelfItem, ReadingProgress, LedgerEntry,
} from '../types';
import {
  seedWorks, seedChapters, seedContents, seedPages, seedPacks, seedAuthors, DEMO_PASSWORD,
} from './seed';

const LS_KEY = 'twilight-blue-mock-v2';
const LS_KEY_LEGACY = 'twilight-blue-mock-v1';

export interface HelpReport {
  id: string;
  category: string;
  subject: string;
  detail: string;
  email: string;
  created_at: string;
  user_id?: string;
  status: 'open' | 'reviewed';
}

export interface TakedownRequest {
  id: string;
  reporter_name: string;
  reporter_email: string;
  reporter_phone?: string;
  work_url: string;
  detail: string;
  evidence?: string;
  sworn: boolean;
  created_at: string;
  status: 'received' | 'reviewing' | 'resolved' | 'rejected';
  admin_notes?: string;
  work_id?: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  created_at: string;
}


export type AuthorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type WorkAdminStatus = 'draft' | 'published' | 'suspended' | 'takedown';

export interface AuthorRecord {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  status: AuthorStatus;
  created_at: string;
  approved_at?: string;
  reject_reason?: string;
}

export interface WriterWork {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  synopsis: string;
  kind: 'novel' | 'manga';
  category: string;
  status: WorkAdminStatus;
  price_full_work: number | null;
  cover_tone: 'default' | 'warm' | 'teal' | 'rose' | 'blue';
  created_at: string;
  updated_at: string;
  is_example_data: true;
}

export interface WriterChapter {
  id: string;
  work_id: string;
  number: number;
  title: string;
  pricing: 'free' | 'coin';
  coin_price: number;
  status: 'draft' | 'published';
  body: string;
  page_count: number;
  updated_at: string;
  is_example_data: true;
}

export interface PayoutRequest {
  id: string;
  author_id: string;
  amount: number;
  bank_document_id: string;
  status: PayoutStatus;
  created_at: string;
  reviewed_at?: string;
  note?: string;
  transaction_id?: string;
}

export interface WriterEarningsFixture {
  pending: number;
  available: number;
  reserved: number;
  paid: number;
  unlock_count: number;
  views_label: string;
}

export interface MockState {
  user: SessionUser | null;
  /** email -> { password, user } */
  accounts: Record<string, { password: string; user: SessionUser; deleted?: boolean }>;
  balances: Record<string, number>;
  unlocks: UnlockRecord[];
  workPurchases: { user_id: string; work_id: string; transaction_id: string }[];
  bookshelf: BookshelfItem[];
  progress: ReadingProgress[];
  ledger: LedgerEntry[];
  /** idempotency: userId|key -> { pack_id, transaction_id, coins } */
  topupKeys: Record<string, { pack_id: string; transaction_id: string; coins: number }>;
  helpReports: HelpReport[];
  takedownRequests: TakedownRequest[];
  passwordResetRequests: PasswordResetRequest[];
  authorsRegistry: AuthorRecord[];
  writerWorks: WriterWork[];
  writerChapters: WriterChapter[];
  payoutRequests: PayoutRequest[];
  writerEarnings: Record<string, WriterEarningsFixture>;
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const DEMO_USER_ID = 'user-demo-001';
const DEMO_BOOKSHELF_WORKS = ['w-cafe', 'w-island'] as const;

function demoBookshelfSeed(): BookshelfItem[] {
  return DEMO_BOOKSHELF_WORKS.map((work_id, i) => ({
    user_id: DEMO_USER_ID,
    work_id,
    added_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  }));
}

function seedWriterCatalog(): { works: WriterWork[]; chapters: WriterChapter[] } {
  const now = nowIso();
  const works: WriterWork[] = seedWorks
    .filter((w) => w.author_id === 'a-001')
    .map((w) => ({
      id: w.id,
      author_id: w.author_id,
      slug: w.slug,
      title: w.title,
      synopsis: w.synopsis,
      kind: w.kind,
      category: w.category,
      status: 'published',
      price_full_work: w.price_full_work,
      cover_tone: w.cover_tone,
      created_at: now,
      updated_at: now,
      is_example_data: true,
    }));
  const chapters: WriterChapter[] = seedChapters
    .filter((c) => works.some((w) => w.id === c.work_id))
    .map((c) => {
      const content = seedContents.find((x) => x.chapter_id === c.id);
      return {
        id: c.id,
        work_id: c.work_id,
        number: c.number,
        title: c.title,
        pricing: c.pricing,
        coin_price: c.coin_price,
        status: 'published',
        body: content?.body ?? '',
        page_count: c.work_id.startsWith('w-') && seedWorks.find((w) => w.id === c.work_id)?.kind === 'manga' ? 3 : 0,
        updated_at: now,
        is_example_data: true,
      };
    });
  return { works, chapters };
}

function defaultState(): MockState {
  const demoUser: SessionUser = {
    id: DEMO_USER_ID,
    email: 'demo@example.com',
    display_name: 'ผู้อ่านตัวอย่าง',
    watermark_id: 'example-user-001',
  };
  const writerUser: SessionUser = {
    id: 'user-writer-001',
    email: 'writer@example.com',
    display_name: 'นามปากกาตัวอย่าง',
    watermark_id: 'writer-user-001',
  };
  const catalog = seedWriterCatalog();
  const now = nowIso();
  return {
    user: null,
    accounts: {
      [demoUser.email]: { password: DEMO_PASSWORD, user: demoUser },
      [writerUser.email]: { password: DEMO_PASSWORD, user: writerUser },
    },
    balances: { [demoUser.id]: 248, [writerUser.id]: 0 },
    unlocks: [],
    workPurchases: [],
    bookshelf: demoBookshelfSeed(),
    progress: [],
    ledger: [
      {
        id: 'led-seed-1',
        kind: 'topup',
        amount: 248,
        coins: 248,
        label: 'เติมเหรียญ mock (ยอดเริ่มต้นตัวอย่าง)',
        created_at: nowIso(),
        transaction_id: 'tx-seed-1',
      },
    ],
    topupKeys: {},
    helpReports: [
      {
        id: 'help-seed-1',
        category: 'อ่าน / ปลดล็อก',
        subject: 'ปลดล็อกแล้วเปิดตอนไม่ได้ (ตัวอย่าง)',
        detail: 'รายงานตัวอย่างสำหรับคิวแอดมิน',
        email: 'demo@example.com',
        created_at: now,
        user_id: DEMO_USER_ID,
        status: 'open',
      },
    ],
    takedownRequests: [
      {
        id: 'td-seed-1',
        reporter_name: 'ตัวแทนสิทธิตัวอย่าง',
        reporter_email: 'rights@example.com',
        work_url: '/works/cafe-ton-tee-sam',
        detail: 'คำร้องตัวอย่าง — ไม่ใช่เคสจริง',
        sworn: true,
        created_at: now,
        status: 'received',
        work_id: 'w-cafe',
      },
    ],
    passwordResetRequests: [],
    authorsRegistry: [
      {
        id: 'a-001',
        user_id: writerUser.id,
        display_name: 'นามปากกาตัวอย่าง',
        bio: 'เขียนนิยายโรแมนติกตัวอย่าง',
        status: 'approved',
        created_at: now,
        approved_at: now,
      },
      {
        id: 'a-pending-001',
        user_id: 'user-pending-writer',
        display_name: 'นักเขียนรอตรวจ',
        bio: 'ใบสมัครตัวอย่างสำหรับคิวอนุมัติ',
        status: 'pending',
        created_at: now,
      },
      {
        id: 'a-002',
        user_id: 'user-author-002',
        display_name: 'นักเขียนสมมติ',
        bio: '',
        status: 'approved',
        created_at: now,
        approved_at: now,
      },
    ],
    writerWorks: catalog.works,
    writerChapters: catalog.chapters,
    payoutRequests: [
      {
        id: 'po-seed-1',
        author_id: 'a-001',
        amount: 500,
        bank_document_id: 'bank-doc-a001-verified',
        status: 'paid',
        created_at: now,
        reviewed_at: now,
        note: 'จ่ายแล้ว (mock)',
        transaction_id: 'tx-payout-seed-1',
      },
    ],
    writerEarnings: {
      'a-001': {
        pending: 1200,
        available: 3450,
        reserved: 800,
        paid: 15000,
        unlock_count: 856,
        views_label: '12.4k',
      },
    },
  };
}

/** Ensure demo user has starter bookshelf if empty (migration / old LS). */
function ensureDemoBookshelf(s: MockState): MockState {
  const demoRows = s.bookshelf.filter((b) => b.user_id === DEMO_USER_ID);
  if (demoRows.length === 0 && s.accounts['demo@example.com']) {
    s.bookshelf = [...s.bookshelf, ...demoBookshelfSeed()];
  }
  return s;
}

function normalize(parsed: Partial<MockState>): MockState {
  const base = defaultState();
  const merged: MockState = {
    ...base,
    ...parsed,
    helpReports: (parsed.helpReports ?? base.helpReports).map((r) => ({
      ...r,
      status: (r as HelpReport).status ?? 'open',
    })),
    takedownRequests: parsed.takedownRequests ?? base.takedownRequests,
    passwordResetRequests: parsed.passwordResetRequests ?? [],
    accounts: { ...base.accounts, ...(parsed.accounts ?? {}) },
    balances: { ...base.balances, ...(parsed.balances ?? {}) },
    authorsRegistry: parsed.authorsRegistry?.length ? parsed.authorsRegistry : base.authorsRegistry,
    writerWorks: parsed.writerWorks?.length ? parsed.writerWorks : base.writerWorks,
    writerChapters: parsed.writerChapters?.length ? parsed.writerChapters : base.writerChapters,
    payoutRequests: parsed.payoutRequests ?? base.payoutRequests,
    writerEarnings: { ...base.writerEarnings, ...(parsed.writerEarnings ?? {}) },
  };
  return ensureDemoBookshelf(merged);
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? localStorage.getItem(LS_KEY_LEGACY);
    if (!raw) return defaultState();
    const state = normalize(JSON.parse(raw) as Partial<MockState>);
    // Persist under v2 if we migrated from v1 or filled bookshelf
    save(state);
    if (localStorage.getItem(LS_KEY_LEGACY) && !localStorage.getItem(LS_KEY)) {
      // keep legacy until overwritten; v2 write already done in save
    }
    return state;
  } catch {
    return defaultState();
  }
}

function save(state: MockState): void {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

let state = typeof localStorage !== 'undefined' ? load() : defaultState();

export const mockDb = {
  works: seedWorks,
  chapters: seedChapters,
  contents: seedContents,
  pages: seedPages,
  packs: seedPacks,
  authors: seedAuthors,
  demoPassword: DEMO_PASSWORD,

  getState: () => state,
  persist: () => save(state),
  reset: () => {
    state = defaultState();
    save(state);
  },

  setUser(user: SessionUser | null) {
    state.user = user;
    save(state);
  },

  balanceOf(userId: string): number {
    return state.balances[userId] ?? 0;
  },

  setBalance(userId: string, n: number) {
    state.balances[userId] = n;
    save(state);
  },

  addLedger(entry: Omit<LedgerEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }) {
    const full: LedgerEntry = {
      id: entry.id ?? uid('led'),
      created_at: entry.created_at ?? nowIso(),
      kind: entry.kind,
      amount: entry.amount,
      coins: entry.coins,
      label: entry.label,
      transaction_id: entry.transaction_id,
    };
    state.ledger = [full, ...state.ledger];
    save(state);
    return full;
  },

  signup(email: string, password: string, display_name: string): SessionUser {
    const key = email.trim().toLowerCase();
    const existing = state.accounts[key];
    if (existing && !existing.deleted) throw new Error('EMAIL_TAKEN');
    const user: SessionUser = {
      id: existing?.user.id ?? uid('user'),
      email: key,
      display_name: display_name.trim() || key.split('@')[0],
      watermark_id: existing?.user.watermark_id ?? `wm-${Math.random().toString(36).slice(2, 10)}`,
    };
    state.accounts[key] = { password, user };
    if (state.balances[user.id] == null) state.balances[user.id] = 0;
    state.user = user;
    save(state);
    return user;
  },

  login(email: string, password: string): SessionUser {
    const key = email.trim().toLowerCase();
    const acc = state.accounts[key];
    if (!acc || acc.deleted || acc.password !== password) throw new Error('INVALID_CREDENTIALS');
    state.user = acc.user;
    save(state);
    return acc.user;
  },

  logout() {
    state.user = null;
    save(state);
  },

  updateDisplayName(displayName: string): SessionUser {
    const u = state.user;
    if (!u) throw new Error('UNAUTHORIZED');
    const name = displayName.trim();
    if (!name) throw new Error('VALIDATION');
    const next = { ...u, display_name: name };
    state.user = next;
    const key = u.email.toLowerCase();
    if (state.accounts[key]) {
      state.accounts[key] = { ...state.accounts[key], user: next };
    }
    save(state);
    return next;
  },

  deleteAccount(password: string): void {
    const u = state.user;
    if (!u) throw new Error('UNAUTHORIZED');
    const key = u.email.toLowerCase();
    const acc = state.accounts[key];
    if (!acc || acc.deleted || acc.password !== password) {
      throw new Error('INVALID_PASSWORD');
    }
    state.accounts[key] = { ...acc, deleted: true, password: '' };
    // Keep ledger/unlock history for admin demo; clear session
    state.user = null;
    save(state);
  },

  submitHelpReport(input: {
    category: string;
    subject: string;
    detail: string;
    email: string;
  }): HelpReport {
    const row: HelpReport = {
      id: uid('help'),
      category: input.category,
      subject: input.subject.trim(),
      detail: input.detail.trim(),
      email: input.email.trim().toLowerCase(),
      created_at: nowIso(),
      user_id: state.user?.id,
      status: 'open',
    };
    state.helpReports = [row, ...state.helpReports];
    save(state);
    return row;
  },

  submitTakedown(input: {
    reporter_name: string;
    reporter_email: string;
    reporter_phone?: string;
    work_url: string;
    detail: string;
    evidence?: string;
    sworn: boolean;
  }): TakedownRequest {
    if (!input.sworn) throw new Error('SWORN_REQUIRED');
    const row: TakedownRequest = {
      id: uid('td'),
      reporter_name: input.reporter_name.trim(),
      reporter_email: input.reporter_email.trim().toLowerCase(),
      reporter_phone: input.reporter_phone?.trim() || undefined,
      work_url: input.work_url.trim(),
      detail: input.detail.trim(),
      evidence: input.evidence?.trim() || undefined,
      sworn: true,
      created_at: nowIso(),
      status: 'received',
    };
    state.takedownRequests = [row, ...state.takedownRequests];
    save(state);
    return row;
  },

  requestPasswordReset(email: string): PasswordResetRequest {
    const row: PasswordResetRequest = {
      id: uid('pwr'),
      email: email.trim().toLowerCase(),
      created_at: nowIso(),
    };
    state.passwordResetRequests = [row, ...state.passwordResetRequests];
    save(state);
    return row;
  },

  isUnlocked(userId: string | undefined, chapterId: string): boolean {
    if (!userId) return false;
    if (state.unlocks.some((u) => u.user_id === userId && u.chapter_id === chapterId)) return true;
    const ch = seedChapters.find((c) => c.id === chapterId);
    if (!ch) return false;
    return state.workPurchases.some((p) => p.user_id === userId && p.work_id === ch.work_id);
  },

  hasWorkPurchase(userId: string, workId: string): boolean {
    return state.workPurchases.some((p) => p.user_id === userId && p.work_id === workId);
  },

  addUnlock(rec: UnlockRecord) {
    state.unlocks.push(rec);
    save(state);
  },

  addWorkPurchase(user_id: string, work_id: string, transaction_id: string) {
    state.workPurchases.push({ user_id, work_id, transaction_id });
    save(state);
  },

  toggleBookshelf(userId: string, workId: string): boolean {
    const i = state.bookshelf.findIndex((b) => b.user_id === userId && b.work_id === workId);
    if (i >= 0) {
      state.bookshelf.splice(i, 1);
      save(state);
      return false;
    }
    state.bookshelf.push({ user_id: userId, work_id: workId, added_at: nowIso() });
    save(state);
    return true;
  },

  inBookshelf(userId: string | undefined, workId: string): boolean {
    if (!userId) return false;
    return state.bookshelf.some((b) => b.user_id === userId && b.work_id === workId);
  },

  setProgress(userId: string, workId: string, chapterId: string, position: number) {
    const i = state.progress.findIndex((p) => p.user_id === userId && p.work_id === workId);
    const row: ReadingProgress = {
      user_id: userId,
      work_id: workId,
      chapter_id: chapterId,
      position,
      updated_at: nowIso(),
    };
    if (i >= 0) state.progress[i] = row;
    else state.progress.push(row);
    save(state);
  },

  newTxId() {
    return uid('tx');
  },

  // —— Writer / Admin studio (mock) ——
  WRITER_POLICY: {
    writer_share_bps: 7000,
    hold_days: 14,
    minimum_payout: 100,
    placeholder: true as const,
  },
  BANK_DOC_FIXTURE: 'bank-doc-a001-verified',

  authorForUser(userId: string | undefined): AuthorRecord | undefined {
    if (!userId) return undefined;
    return state.authorsRegistry.find((a) => a.user_id === userId);
  },

  listAuthorsRegistry() {
    return [...state.authorsRegistry];
  },

  applyAuthor(input: { display_name: string; bio: string }): AuthorRecord {
    const u = state.user;
    if (!u) throw new Error('UNAUTHORIZED');
    const existing = state.authorsRegistry.find((a) => a.user_id === u.id);
    if (existing && existing.status !== 'rejected') throw new Error('ALREADY_APPLIED');
    const row: AuthorRecord = {
      id: existing?.id ?? uid('a'),
      user_id: u.id,
      display_name: input.display_name.trim(),
      bio: input.bio.trim(),
      status: 'pending',
      created_at: nowIso(),
    };
    if (existing) {
      state.authorsRegistry = state.authorsRegistry.map((a) => (a.id === existing.id ? row : a));
    } else {
      state.authorsRegistry = [row, ...state.authorsRegistry];
    }
    save(state);
    return row;
  },

  reviewAuthor(authorId: string, decision: 'approved' | 'rejected', reason?: string) {
    const i = state.authorsRegistry.findIndex((a) => a.id === authorId);
    if (i < 0) throw new Error('NOT_FOUND');
    const row = state.authorsRegistry[i];
    state.authorsRegistry[i] = {
      ...row,
      status: decision,
      approved_at: decision === 'approved' ? nowIso() : undefined,
      reject_reason: decision === 'rejected' ? (reason || 'ไม่อนุมัติ') : undefined,
    };
    save(state);
    return state.authorsRegistry[i];
  },

  writerDashboard(authorId: string) {
    const author = state.authorsRegistry.find((a) => a.id === authorId);
    if (!author) throw new Error('NOT_FOUND');
    const works = state.writerWorks.filter((w) => w.author_id === authorId);
    const earnings = state.writerEarnings[authorId] ?? {
      pending: 0, available: 0, reserved: 0, paid: 0, unlock_count: 0, views_label: '0',
    };
    return {
      author_id: authorId,
      author_status: author.status,
      metrics_origin: 'mock-fixture' as const,
      works_count: works.length,
      unlock_count: earnings.unlock_count,
      earnings: {
        pending: earnings.pending,
        available: earnings.available,
        reserved: earnings.reserved,
        paid: earnings.paid,
      },
      views_label: earnings.views_label,
      policy: mockDb.WRITER_POLICY,
    };
  },

  listWriterWorks(authorId: string) {
    return state.writerWorks.filter((w) => w.author_id === authorId).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  getWriterWork(workId: string) {
    return state.writerWorks.find((w) => w.id === workId);
  },

  saveWriterWork(input: Partial<WriterWork> & { author_id: string; title: string; kind: 'novel' | 'manga' }): WriterWork {
    const now = nowIso();
    if (input.id) {
      const i = state.writerWorks.findIndex((w) => w.id === input.id);
      if (i < 0) throw new Error('NOT_FOUND');
      const prev = state.writerWorks[i];
      const next: WriterWork = {
        ...prev,
        ...input,
        title: input.title.trim(),
        synopsis: (input.synopsis ?? prev.synopsis).trim(),
        slug: input.slug?.trim() || prev.slug,
        updated_at: now,
        is_example_data: true,
      };
      state.writerWorks[i] = next;
      save(state);
      return next;
    }
    const id = uid('ww');
    const slug = (input.slug || input.title).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0e00-\u0e7f-]/gi, '') || id;
    const row: WriterWork = {
      id,
      author_id: input.author_id,
      slug,
      title: input.title.trim(),
      synopsis: (input.synopsis ?? '').trim(),
      kind: input.kind,
      category: input.category ?? 'ทั่วไป',
      status: input.status ?? 'draft',
      price_full_work: input.price_full_work ?? null,
      cover_tone: input.cover_tone ?? 'default',
      created_at: now,
      updated_at: now,
      is_example_data: true,
    };
    state.writerWorks = [row, ...state.writerWorks];
    save(state);
    return row;
  },

  listWriterChapters(workId: string) {
    return state.writerChapters.filter((c) => c.work_id === workId).sort((a, b) => a.number - b.number);
  },

  getWriterChapter(chapterId: string) {
    return state.writerChapters.find((c) => c.id === chapterId);
  },

  saveWriterChapter(input: Partial<WriterChapter> & { work_id: string; title: string }): WriterChapter {
    const now = nowIso();
    if (input.id) {
      const i = state.writerChapters.findIndex((c) => c.id === input.id);
      if (i < 0) throw new Error('NOT_FOUND');
      const prev = state.writerChapters[i];
      const next: WriterChapter = {
        ...prev,
        ...input,
        title: input.title.trim(),
        body: input.body ?? prev.body,
        updated_at: now,
        is_example_data: true,
      };
      state.writerChapters[i] = next;
      save(state);
      return next;
    }
    const siblings = state.writerChapters.filter((c) => c.work_id === input.work_id);
    const number = input.number ?? (siblings.reduce((m, c) => Math.max(m, c.number), 0) + 1);
    const row: WriterChapter = {
      id: uid('wch'),
      work_id: input.work_id,
      number,
      title: input.title.trim(),
      pricing: input.pricing ?? 'free',
      coin_price: input.pricing === 'coin' ? (input.coin_price ?? 5) : 0,
      status: input.status ?? 'draft',
      body: input.body ?? '',
      page_count: input.page_count ?? 0,
      updated_at: now,
      is_example_data: true,
    };
    state.writerChapters = [...state.writerChapters, row];
    const wi = state.writerWorks.findIndex((w) => w.id === input.work_id);
    if (wi >= 0) state.writerWorks[wi] = { ...state.writerWorks[wi], updated_at: now };
    save(state);
    return row;
  },

  requestPayout(authorId: string, amount: number, bankDocumentId: string): PayoutRequest {
    const author = state.authorsRegistry.find((a) => a.id === authorId);
    if (!author || author.status !== 'approved') throw new Error('AUTHOR_NOT_APPROVED');
    if (amount < mockDb.WRITER_POLICY.minimum_payout) throw new Error('BELOW_MINIMUM');
    const earnings = state.writerEarnings[authorId];
    if (!earnings || amount > earnings.available) throw new Error('INSUFFICIENT_AVAILABLE');
    const row: PayoutRequest = {
      id: uid('po'),
      author_id: authorId,
      amount,
      bank_document_id: bankDocumentId,
      status: 'pending',
      created_at: nowIso(),
    };
    state.payoutRequests = [row, ...state.payoutRequests];
    earnings.available -= amount;
    earnings.reserved += amount;
    save(state);
    return row;
  },

  listPayouts(authorId?: string) {
    const list = authorId ? state.payoutRequests.filter((p) => p.author_id === authorId) : state.payoutRequests;
    return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  reviewPayout(payoutId: string, decision: 'approved' | 'rejected', note?: string) {
    const i = state.payoutRequests.findIndex((p) => p.id === payoutId);
    if (i < 0) throw new Error('NOT_FOUND');
    const row = state.payoutRequests[i];
    if (row.status !== 'pending') throw new Error('INVALID_STATUS');
    const earnings = state.writerEarnings[row.author_id];
    if (decision === 'rejected' && earnings) {
      earnings.reserved = Math.max(0, earnings.reserved - row.amount);
      earnings.available += row.amount;
    }
    state.payoutRequests[i] = {
      ...row,
      status: decision,
      reviewed_at: nowIso(),
      note: note || (decision === 'approved' ? 'อนุมัติ (mock)' : 'ปฏิเสธ (mock)'),
    };
    save(state);
    return state.payoutRequests[i];
  },

  payPayout(payoutId: string, note?: string) {
    const i = state.payoutRequests.findIndex((p) => p.id === payoutId);
    if (i < 0) throw new Error('NOT_FOUND');
    const row = state.payoutRequests[i];
    if (row.status !== 'approved' && row.status !== 'pending') throw new Error('INVALID_STATUS');
    const earnings = state.writerEarnings[row.author_id];
    if (earnings) {
      if (row.status === 'pending') earnings.reserved = Math.max(0, earnings.reserved - row.amount);
      else earnings.reserved = Math.max(0, earnings.reserved - row.amount);
      earnings.paid += row.amount;
    }
    const tx = uid('tx');
    state.payoutRequests[i] = {
      ...row,
      status: 'paid',
      reviewed_at: nowIso(),
      note: note || 'จ่ายแล้ว (admin_mock_pay)',
      transaction_id: tx,
    };
    mockDb.addLedger({
      kind: 'topup',
      amount: -row.amount,
      coins: 0,
      label: `ถอนนักเขียน mock · ${row.author_id}`,
      transaction_id: tx,
    });
    save(state);
    return state.payoutRequests[i];
  },

  markHelpReviewed(id: string) {
    const i = state.helpReports.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('NOT_FOUND');
    state.helpReports[i] = { ...state.helpReports[i], status: 'reviewed' };
    save(state);
    return state.helpReports[i];
  },

  reviewTakedown(id: string, decision: 'reviewing' | 'resolved' | 'rejected', notes?: string) {
    const i = state.takedownRequests.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('NOT_FOUND');
    const row = state.takedownRequests[i];
    state.takedownRequests[i] = {
      ...row,
      status: decision,
      admin_notes: notes,
    };
    if (decision === 'resolved' && row.work_id) {
      const wi = state.writerWorks.findIndex((w) => w.id === row.work_id);
      if (wi >= 0) state.writerWorks[wi] = { ...state.writerWorks[wi], status: 'takedown', updated_at: nowIso() };
    }
    save(state);
    return state.takedownRequests[i];
  },

  setWriterWorkStatus(workId: string, status: WorkAdminStatus) {
    const i = state.writerWorks.findIndex((w) => w.id === workId);
    if (i < 0) throw new Error('NOT_FOUND');
    state.writerWorks[i] = { ...state.writerWorks[i], status, updated_at: nowIso() };
    save(state);
    return state.writerWorks[i];
  },

  adminSummary() {
    return {
      topup_today_label: '—',
      liability_label: '—',
      authors_pending: state.authorsRegistry.filter((a) => a.status === 'pending').length,
      reports_open: state.helpReports.filter((r) => r.status === 'open').length,
      takedowns_open: state.takedownRequests.filter((r) => r.status === 'received' || r.status === 'reviewing').length,
      payouts_pending: state.payoutRequests.filter((p) => p.status === 'pending').length,
      works_count: state.writerWorks.length,
      ledger_count: state.ledger.length,
    };
  },
};
