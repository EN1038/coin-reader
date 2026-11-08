import type {
  SessionUser, UnlockRecord, BookshelfItem, ReadingProgress, LedgerEntry, ReaderComment,
  Work, Chapter,
} from '../types';
import {
  seedWorks, seedChapters, seedContents, seedPages, seedPacks, seedAuthors, DEMO_PASSWORD,
  DEMO_REFERRAL_CODE, REFERRAL_PERCENT, seedComments,
} from './seed';
import { bangkokToday, checkInReward, isoDay, bangkokParts, daysInMonth } from '../format';

const LS_KEY = 'twilight-blue-mock-v3';

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
  free_episode_count: number;
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
  follow_free: boolean;
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
  /** coin sales before the platform fee */
  sales_coins: number;
  tip_coins: number;
  platform_fee_coins: number;
  net_coins: number;
}

export interface ReferralProfile {
  code: string;
  referred_by?: string;
}

export interface ReferralEvent {
  id: string;
  referrer_id: string;
  referee_id: string;
  paid_coins: number;
  reward_coins: number;
  created_at: string;
  transaction_id: string;
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
  tickets: Record<string, number>;
  checkins: Record<string, string[]>;
  comments: ReaderComment[];
  commentLikes: { user_id: string; comment_id: string }[];
  ratings: { user_id: string; work_id: string; stars: number }[];
  referrals: Record<string, ReferralProfile>;
  referralEvents: ReferralEvent[];
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const DEMO_USER_ID = 'user-demo-001';
const DEMO_BOOKSHELF_WORKS = ['w-cafe', 'w-island', 'w-kdt', 'w-sword', 'w-lib'] as const;

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
      free_episode_count: w.free_episode_count,
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
        follow_free: !!c.follow_free,
        status: 'published',
        body: content?.body ?? '',
        page_count: c.work_id.startsWith('w-') && seedWorks.find((w) => w.id === c.work_id)?.kind === 'manga' ? 3 : 0,
        updated_at: now,
        is_example_data: true,
      };
    });
  return { works, chapters };
}

function earningsOf(sales: number, tips: number, pending = 0): WriterEarningsFixture {
  const gross = sales + tips;
  const fee = Math.floor(gross * 3000 / 10000);
  const net = gross - fee;
  return {
    pending,
    available: net,
    reserved: 0,
    paid: 15000,
    unlock_count: 856,
    views_label: '86.2k',
    sales_coins: sales,
    tip_coins: tips,
    platform_fee_coins: fee,
    net_coins: net,
  };
}

function priorCheckins(today: string): string[] {
  const { y, m, d } = bangkokParts(today);
  const out: string[] = [];
  for (let day = 1; day < d; day += 1) out.push(isoDay(y, m, day));
  return out;
}

function sumCheckin(days: string[], today: string): { coins: number; tickets: number } {
  return days.reduce(
    (acc, day) => {
      const reward = checkInReward(day, today);
      acc.coins += reward.coins;
      acc.tickets += reward.tickets;
      return acc;
    },
    { coins: 0, tickets: 0 },
  );
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
  const friendUser: SessionUser = {
    id: 'user-friend-001',
    email: 'friend@example.com',
    display_name: 'เพื่อนตัวอย่าง',
    watermark_id: 'friend-user-001',
  };
  const catalog = seedWriterCatalog();
  const now = nowIso();
  const today = bangkokToday();
  const claimed = priorCheckins(today);
  const checkin = sumCheckin(claimed, today);
  const topupCoins = 350;
  const referralCoins = 7;
  const unlockCoins = 2;
  const tipCoins = 10;
  const demoBalance = topupCoins + checkin.coins + referralCoins - unlockCoins - tipCoins;
  const hour = 3600_000;
  return {
    user: null,
    accounts: {
      [demoUser.email]: { password: DEMO_PASSWORD, user: demoUser },
      [writerUser.email]: { password: DEMO_PASSWORD, user: writerUser },
      [friendUser.email]: { password: DEMO_PASSWORD, user: friendUser },
    },
    balances: { [demoUser.id]: demoBalance, [writerUser.id]: 40, [friendUser.id]: 80 },
    unlocks: [
      {
        user_id: DEMO_USER_ID,
        chapter_id: 'w-cafe-c4',
        work_id: 'w-cafe',
        transaction_id: 'tx-seed-unlock',
        free: false,
      },
    ],
    workPurchases: [],
    bookshelf: demoBookshelfSeed(),
    progress: [
      { user_id: DEMO_USER_ID, work_id: 'w-cafe', chapter_id: 'w-cafe-c3', position: 0.4, updated_at: new Date(Date.now() - 2 * hour).toISOString() },
      { user_id: DEMO_USER_ID, work_id: 'w-island', chapter_id: 'w-island-c2', position: 0.2, updated_at: new Date(Date.now() - 26 * hour).toISOString() },
      { user_id: DEMO_USER_ID, work_id: 'w-kdt', chapter_id: 'w-kdt-c2', position: 0.8, updated_at: new Date(Date.now() - 50 * hour).toISOString() },
      { user_id: DEMO_USER_ID, work_id: 'w-sword', chapter_id: 'w-sword-c1', position: 0.1, updated_at: new Date(Date.now() - 5 * hour).toISOString() },
    ],
    ledger: [
      {
        id: 'led-seed-tip',
        user_id: DEMO_USER_ID,
        kind: 'tip',
        amount: -tipCoins,
        coins: tipCoins,
        label: 'สนับสนุนนักเขียน · คืนที่ดาวตก',
        created_at: new Date(Date.now() - 3 * hour).toISOString(),
        transaction_id: 'tx-seed-tip',
      },
      {
        id: 'led-seed-unlock',
        user_id: DEMO_USER_ID,
        kind: 'unlock',
        amount: -unlockCoins,
        coins: unlockCoins,
        label: 'ปลดล็อกตอนที่ 4 · คาเฟ่ตอนตีสาม',
        created_at: new Date(Date.now() - 20 * hour).toISOString(),
        transaction_id: 'tx-seed-unlock',
      },
      {
        id: 'led-seed-ref',
        user_id: DEMO_USER_ID,
        kind: 'referral',
        amount: referralCoins,
        coins: referralCoins,
        label: 'แนะนำเพื่อน 7% จากยอดเติม 100 (ไม่รวมโบนัส)',
        created_at: new Date(Date.now() - 30 * hour).toISOString(),
        transaction_id: 'tx-seed-ref',
      },
      ...(checkin.coins > 0
        ? [{
          id: 'led-seed-checkin',
          user_id: DEMO_USER_ID,
          kind: 'checkin' as const,
          amount: checkin.coins,
          coins: checkin.coins,
          label: `เช็คอินรายวัน · ${claimed.length} วัน`,
          created_at: new Date(Date.now() - 10 * hour).toISOString(),
          transaction_id: 'tx-seed-checkin',
        }]
        : []),
      {
        id: 'led-seed-topup',
        user_id: DEMO_USER_ID,
        kind: 'topup',
        amount: topupCoins,
        coins: topupCoins,
        label: 'เติม 300 เหรียญ + โบนัส 50 (mock)',
        created_at: new Date(Date.now() - 4 * 24 * hour).toISOString(),
        transaction_id: 'tx-seed-topup',
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
      'a-001': earningsOf(5000, 500, 400),
    },
    tickets: { [demoUser.id]: checkin.tickets, [writerUser.id]: 0, [friendUser.id]: 0 },
    checkins: { [demoUser.id]: claimed },
    comments: seedComments.map((c) => ({ ...c, like_count: 0 })),
    commentLikes: seedComments.flatMap((c) =>
      Array.from({ length: c.like_count }, (_, i) => ({
        user_id: i === 0 && c.id === 'cmt-1' ? DEMO_USER_ID : `like-seed-${c.id}-${i}`,
        comment_id: c.id,
      })),
    ),
    ratings: [],
    referrals: {
      [demoUser.id]: { code: DEMO_REFERRAL_CODE },
      [writerUser.id]: { code: 'TBWRITER' },
      [friendUser.id]: { code: 'TBFRIEND', referred_by: demoUser.id },
    },
    referralEvents: [
      {
        id: 'ref-seed-1',
        referrer_id: demoUser.id,
        referee_id: friendUser.id,
        paid_coins: 100,
        reward_coins: referralCoins,
        created_at: new Date(Date.now() - 30 * hour).toISOString(),
        transaction_id: 'tx-seed-ref',
      },
    ],
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
    tickets: { ...base.tickets, ...(parsed.tickets ?? {}) },
    checkins: { ...base.checkins, ...(parsed.checkins ?? {}) },
    comments: parsed.comments?.length ? parsed.comments : base.comments,
    commentLikes: parsed.commentLikes ?? base.commentLikes,
    ratings: parsed.ratings ?? [],
    referrals: { ...base.referrals, ...(parsed.referrals ?? {}) },
    referralEvents: parsed.referralEvents ?? base.referralEvents,
  };
  for (const [id, row] of Object.entries(merged.writerEarnings)) {
    merged.writerEarnings[id] = {
      pending: row.pending ?? 0,
      available: row.available ?? 0,
      reserved: row.reserved ?? 0,
      paid: row.paid ?? 0,
      unlock_count: row.unlock_count ?? 0,
      views_label: row.views_label ?? '0',
      sales_coins: row.sales_coins ?? 0,
      tip_coins: row.tip_coins ?? 0,
      platform_fee_coins: row.platform_fee_coins ?? 0,
      net_coins: row.net_coins ?? 0,
    };
  }
  return ensureDemoBookshelf(merged);
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const state = normalize(JSON.parse(raw) as Partial<MockState>);
    save(state);
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
  works: seedWorks.map((w) => ({ ...w })),
  chapters: seedChapters.map((c) => ({ ...c })),
  contents: seedContents.map((c) => ({ ...c })),
  pages: seedPages.map((p) => ({ ...p })),
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
      user_id: entry.user_id ?? state.user?.id,
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

  signup(email: string, password: string, display_name: string, referralCode?: string): SessionUser {
    const key = email.trim().toLowerCase();
    const existing = state.accounts[key];
    if (existing && !existing.deleted) throw new Error('EMAIL_TAKEN');
    const user: SessionUser = {
      id: existing?.user.id ?? uid('user'),
      email: key,
      display_name: display_name.trim() || key.split('@')[0],
      watermark_id: existing?.user.watermark_id ?? `wm-${Math.random().toString(36).slice(2, 10)}`,
    };
    let referredBy: string | undefined;
    const code = referralCode?.trim().toUpperCase();
    if (code) {
      const referrer = Object.entries(state.referrals).find(([, row]) => row.code === code);
      if (!referrer) throw new Error('BAD_REFERRAL');
      if (referrer[0] === user.id) throw new Error('BAD_REFERRAL');
      referredBy = referrer[0];
    }
    state.accounts[key] = { password, user };
    if (state.balances[user.id] == null) state.balances[user.id] = 0;
    if (state.tickets[user.id] == null) state.tickets[user.id] = 0;
    state.referrals[user.id] = {
      code: `TB${user.id.replace(/\W/g, '').slice(-6).toUpperCase()}`,
      referred_by: referredBy,
    };
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
      sales_coins: 0, tip_coins: 0, platform_fee_coins: 0, net_coins: 0,
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
        sales_coins: earnings.sales_coins,
        tip_coins: earnings.tip_coins,
        platform_fee_coins: earnings.platform_fee_coins,
        net_coins: earnings.net_coins,
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
      mockDb.syncReaderCatalog();
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
      free_episode_count: input.free_episode_count ?? 0,
      cover_tone: input.cover_tone ?? 'default',
      created_at: now,
      updated_at: now,
      is_example_data: true,
    };
    state.writerWorks = [row, ...state.writerWorks];
    save(state);
    mockDb.syncReaderCatalog();
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
      mockDb.syncReaderCatalog();
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
      follow_free: input.pricing === 'coin' && !!input.follow_free,
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
    mockDb.syncReaderCatalog();
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

  syncReaderCatalog() {
    for (const w of state.writerWorks) {
      if (w.status !== 'published') continue;
      const idx = mockDb.works.findIndex((x) => x.id === w.id);
      if (idx >= 0) {
        mockDb.works[idx] = {
          ...mockDb.works[idx],
          title: w.title,
          synopsis: w.synopsis,
          category: w.category,
          kind: w.kind,
          free_episode_count: w.free_episode_count ?? mockDb.works[idx].free_episode_count,
          price_full_work: w.price_full_work,
          author_id: w.author_id,
        };
      } else {
        const author = state.authorsRegistry.find((a) => a.id === w.author_id);
        mockDb.works.unshift({
          id: w.id,
          slug: w.slug,
          title: w.title,
          synopsis: w.synopsis,
          kind: w.kind,
          category: w.category,
          tags: [w.category],
          rating: 'ทั่วไป',
          status: 'published',
          cover_tone: w.cover_tone,
          author_id: w.author_id,
          author_name: author?.display_name ?? 'นักเขียน',
          price_full_work: w.price_full_work,
          chapter_count: state.writerChapters.filter((c) => c.work_id === w.id && c.status === 'published').length,
          free_episode_count: w.free_episode_count ?? 0,
          views: 0,
          score: 0,
          rating_count: 0,
          rank_daily: 0,
          rank_weekly: 0,
          rank_monthly: 0,
          latest_at: w.updated_at,
          is_example_data: true,
          is_new: true,
        });
      }
    }
    for (const c of state.writerChapters) {
      if (c.status !== 'published') continue;
      const patch: Partial<Chapter> = {
        title: c.title,
        pricing: c.pricing,
        coin_price: c.pricing === 'coin' ? c.coin_price : 0,
        follow_free: c.pricing === 'coin' && !!c.follow_free,
      };
      const idx = mockDb.chapters.findIndex((x) => x.id === c.id);
      if (idx >= 0) mockDb.chapters[idx] = { ...mockDb.chapters[idx], ...patch };
      else {
        mockDb.chapters.push({
          id: c.id,
          work_id: c.work_id,
          number: c.number,
          title: c.title,
          pricing: c.pricing,
          coin_price: patch.coin_price ?? 0,
          follow_free: patch.follow_free,
          published_at: c.updated_at,
          status: 'published',
          is_example_data: true,
        });
      }
      if (c.body) {
        const ci = mockDb.contents.findIndex((x) => x.chapter_id === c.id);
        if (ci >= 0) mockDb.contents[ci] = { chapter_id: c.id, body: c.body };
        else mockDb.contents.push({ chapter_id: c.id, body: c.body });
      }
      const work = mockDb.works.find((w) => w.id === c.work_id);
      if (work) {
        const published = mockDb.chapters.filter((ch) => ch.work_id === work.id);
        work.chapter_count = published.length;
        const latest = published.map((ch) => ch.published_at).sort().at(-1);
        if (latest) work.latest_at = latest;
      }
    }
  },

  findWork(id: string): Work | undefined {
    return mockDb.works.find((w) => w.id === id);
  },

  findChapter(id: string): Chapter | undefined {
    return mockDb.chapters.find((c) => c.id === id);
  },

  canRead(userId: string | undefined, chapterId: string): boolean {
    const chapter = mockDb.findChapter(chapterId);
    const work = chapter ? mockDb.findWork(chapter.work_id) : undefined;
    if (!chapter || !work) return false;
    if (chapter.pricing === 'free' || chapter.number <= work.free_episode_count) return true;
    if (userId && mockDb.isUnlocked(userId, chapterId)) return true;
    if (chapter.follow_free && userId && mockDb.inBookshelf(userId, work.id)) return true;
    return false;
  },

  ticketCount(userId: string): number {
    return state.tickets[userId] ?? 0;
  },

  checkInView(userId: string) {
    const today = bangkokToday();
    const claimed = state.checkins[userId] ?? [];
    const { y, m } = bangkokParts(today);
    return {
      month: `${y}-${String(m).padStart(2, '0')}`,
      today,
      claimed: claimed.filter((d) => d.startsWith(`${y}-${String(m).padStart(2, '0')}`)),
      claimed_today: claimed.includes(today),
      tickets: mockDb.ticketCount(userId),
      daily_coins: 2,
      month_end_coins: 30,
      month_end_tickets: 3,
      days_in_month: daysInMonth(today),
    };
  },

  claimCheckIn(userId: string) {
    const today = bangkokToday();
    const claimed = state.checkins[userId] ?? [];
    const tickets = mockDb.ticketCount(userId);
    if (claimed.includes(today)) {
      return {
        already: true,
        coins: 0,
        tickets: 0,
        balance: mockDb.balanceOf(userId),
        ticket_balance: tickets,
        month_end: checkInReward(today, today).monthEnd,
        today,
      };
    }
    const reward = checkInReward(today, today);
    state.checkins[userId] = [...claimed, today];
    state.tickets[userId] = tickets + reward.tickets;
    const tx = mockDb.newTxId();
    const next = mockDb.balanceOf(userId) + reward.coins;
    mockDb.setBalance(userId, next);
    const label = reward.monthEnd
      ? `เช็คอินรางวัลท้ายเดือน +${reward.coins} เหรียญ${reward.tickets ? ` +${reward.tickets} ตั๋ว` : ''}`
      : `เช็คอินรายวัน +${reward.coins} เหรียญ${reward.tickets ? ` +${reward.tickets} ตั๋ว` : ''}`;
    mockDb.addLedger({
      user_id: userId,
      kind: 'checkin',
      amount: reward.coins,
      coins: reward.coins,
      label,
      transaction_id: tx,
    });
    return {
      already: false,
      coins: reward.coins,
      tickets: reward.tickets,
      balance: next,
      ticket_balance: state.tickets[userId],
      month_end: reward.monthEnd,
      today,
    };
  },

  spendTicket(userId: string, chapterId: string) {
    const chapter = mockDb.findChapter(chapterId);
    if (!chapter) throw new Error('NOT_FOUND');
    const work = mockDb.findWork(chapter.work_id);
    if (!work) throw new Error('NOT_FOUND');
    if (chapter.pricing === 'free' || chapter.number <= work.free_episode_count) throw new Error('ALREADY_FREE');
    if (mockDb.isUnlocked(userId, chapterId)) throw new Error('ALREADY_UNLOCKED');
    if (chapter.follow_free && mockDb.inBookshelf(userId, work.id)) throw new Error('ALREADY_FREE');
    const tickets = mockDb.ticketCount(userId);
    if (tickets < 1) throw new Error('NO_TICKET');
    state.tickets[userId] = tickets - 1;
    const tx = mockDb.newTxId();
    mockDb.addUnlock({
      user_id: userId,
      chapter_id: chapter.id,
      work_id: work.id,
      transaction_id: tx,
      free: false,
    });
    mockDb.addLedger({
      user_id: userId,
      kind: 'unlock',
      amount: 0,
      coins: 0,
      label: `ใช้ตั๋วอ่านฟรี · ตอนที่ ${chapter.number} ${work.title}`,
      transaction_id: tx,
    });
    return { transaction_id: tx, balance: mockDb.balanceOf(userId), ticket_balance: state.tickets[userId], chapter_id: chapter.id };
  },

  creditReferral(refereeId: string, paidCoins: number, sourceTx: string) {
    if (paidCoins <= 0) return;
    const profile = state.referrals[refereeId];
    const referrerId = profile?.referred_by;
    if (!referrerId || referrerId === refereeId) return;
    if (state.referralEvents.some((e) => e.transaction_id === `ref-${sourceTx}`)) return;
    const reward = Math.floor(paidCoins * REFERRAL_PERCENT / 100);
    if (reward <= 0) return;
    const tx = `ref-${sourceTx}`;
    const next = mockDb.balanceOf(referrerId) + reward;
    mockDb.setBalance(referrerId, next);
    mockDb.addLedger({
      user_id: referrerId,
      kind: 'referral',
      amount: reward,
      coins: reward,
      label: `แนะนำเพื่อน ${REFERRAL_PERCENT}% จากยอดเติม ${paidCoins} (ไม่รวมโบนัส)`,
      transaction_id: tx,
    });
    state.referralEvents = [
      {
        id: uid('ref'),
        referrer_id: referrerId,
        referee_id: refereeId,
        paid_coins: paidCoins,
        reward_coins: reward,
        created_at: nowIso(),
        transaction_id: tx,
      },
      ...state.referralEvents,
    ];
    save(state);
  },

  referralView(userId: string) {
    const profile = state.referrals[userId] ?? { code: `TB${userId.slice(-6).toUpperCase()}` };
    if (!state.referrals[userId]) {
      state.referrals[userId] = profile;
      save(state);
    }
    const friends = state.referralEvents
      .filter((e) => e.referrer_id === userId)
      .map((e) => {
        const acc = Object.values(state.accounts).find((a) => a.user.id === e.referee_id);
        return {
          display_name: acc?.user.display_name ?? 'เพื่อน',
          paid_coins: e.paid_coins,
          reward_coins: e.reward_coins,
          created_at: e.created_at,
        };
      });
    return {
      code: profile.code,
      percent: REFERRAL_PERCENT,
      earned_coins: friends.reduce((s, f) => s + f.reward_coins, 0),
      friends,
    };
  },

  listComments(chapterId: string, userId?: string): ReaderComment[] {
    return state.comments
      .filter((c) => c.chapter_id === chapterId)
      .map((c) => ({
        ...c,
        like_count: state.commentLikes.filter((l) => l.comment_id === c.id).length,
        liked_by_me: !!userId && state.commentLikes.some((l) => l.comment_id === c.id && l.user_id === userId),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  addComment(userId: string, chapterId: string, body: string): ReaderComment {
    const text = body.trim();
    if (text.length < 1 || text.length > 1000) throw new Error('VALIDATION');
    if (!mockDb.canRead(userId, chapterId)) throw new Error('UNAUTHORIZED');
    const acc = Object.values(state.accounts).find((a) => a.user.id === userId);
    const row: ReaderComment = {
      id: uid('cmt'),
      chapter_id: chapterId,
      user_id: userId,
      display_name: acc?.user.display_name ?? 'ผู้อ่าน',
      body: text,
      created_at: nowIso(),
      like_count: 0,
      liked_by_me: false,
    };
    state.comments = [row, ...state.comments];
    save(state);
    return row;
  },

  toggleCommentLike(userId: string, commentId: string): ReaderComment {
    const comment = state.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('NOT_FOUND');
    const i = state.commentLikes.findIndex((l) => l.user_id === userId && l.comment_id === commentId);
    if (i >= 0) state.commentLikes.splice(i, 1);
    else state.commentLikes.push({ user_id: userId, comment_id: commentId });
    save(state);
    return mockDb.listComments(comment.chapter_id, userId).find((c) => c.id === commentId)!;
  },

  myStars(userId: string | undefined, workId: string): number | null {
    if (!userId) return null;
    return state.ratings.find((r) => r.user_id === userId && r.work_id === workId)?.stars ?? null;
  },

  rateWork(userId: string, workId: string, stars: number) {
    if (stars < 1 || stars > 5) throw new Error('VALIDATION');
    const work = mockDb.findWork(workId);
    if (!work) throw new Error('NOT_FOUND');
    const prev = state.ratings.find((r) => r.user_id === userId && r.work_id === workId);
    const prevTotal = work.score * work.rating_count;
    if (prev) {
      const nextTotal = prevTotal - prev.stars + stars;
      work.score = Math.round((nextTotal / Math.max(1, work.rating_count)) * 10) / 10;
      prev.stars = stars;
    } else {
      const count = work.rating_count + 1;
      work.score = Math.round(((prevTotal + stars) / count) * 10) / 10;
      work.rating_count = count;
      state.ratings.push({ user_id: userId, work_id: workId, stars });
    }
    save(state);
    return { score: work.score, rating_count: work.rating_count, mine: stars };
  },

  tipWriter(userId: string, workId: string, coins: number) {
    if (!Number.isInteger(coins) || coins < 1) throw new Error('VALIDATION');
    const work = mockDb.findWork(workId);
    if (!work) throw new Error('NOT_FOUND');
    const bal = mockDb.balanceOf(userId);
    if (bal < coins) throw new Error('INSUFFICIENT_COINS');
    const tx = mockDb.newTxId();
    const next = bal - coins;
    mockDb.setBalance(userId, next);
    mockDb.addLedger({
      user_id: userId,
      kind: 'tip',
      amount: -coins,
      coins,
      label: `สนับสนุนนักเขียน · ${work.title}`,
      transaction_id: tx,
    });
    const earnings = state.writerEarnings[work.author_id] ?? {
      pending: 0, available: 0, reserved: 0, paid: 0, unlock_count: 0, views_label: '0',
      sales_coins: 0, tip_coins: 0, platform_fee_coins: 0, net_coins: 0,
    };
    const alreadyDrawn = Math.max(0, earnings.net_coins - earnings.available - earnings.reserved);
    earnings.tip_coins += coins;
    const gross = earnings.sales_coins + earnings.tip_coins;
    earnings.platform_fee_coins = Math.floor(gross * 3000 / 10000);
    earnings.net_coins = gross - earnings.platform_fee_coins;
    earnings.available = Math.max(0, earnings.net_coins - earnings.reserved - alreadyDrawn);
    state.writerEarnings[work.author_id] = earnings;
    save(state);
    return { balance: next, transaction_id: tx };
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

mockDb.syncReaderCatalog();
