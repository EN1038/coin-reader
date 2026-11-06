import type {
  SessionUser, UnlockRecord, BookshelfItem, ReadingProgress, LedgerEntry,
} from '../types';
import {
  seedWorks, seedChapters, seedContents, seedPages, seedPacks, seedAuthors, DEMO_PASSWORD,
} from './seed';

const LS_KEY = 'twilight-blue-mock-v1';

export interface MockState {
  user: SessionUser | null;
  /** email -> { password, user } */
  accounts: Record<string, { password: string; user: SessionUser }>;
  balances: Record<string, number>;
  unlocks: UnlockRecord[];
  workPurchases: { user_id: string; work_id: string; transaction_id: string }[];
  bookshelf: BookshelfItem[];
  progress: ReadingProgress[];
  ledger: LedgerEntry[];
  /** idempotency: userId|key -> { pack_id, transaction_id, coins } */
  topupKeys: Record<string, { pack_id: string; transaction_id: string; coins: number }>;
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultState(): MockState {
  const demoUser: SessionUser = {
    id: 'user-demo-001',
    email: 'demo@example.com',
    display_name: 'ผู้อ่านตัวอย่าง',
    watermark_id: 'example-user-001',
  };
  return {
    user: null,
    accounts: {
      [demoUser.email]: { password: DEMO_PASSWORD, user: demoUser },
    },
    balances: { [demoUser.id]: 248 },
    unlocks: [],
    workPurchases: [],
    bookshelf: [],
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
  };
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) } as MockState;
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
    if (state.accounts[key]) throw new Error('EMAIL_TAKEN');
    const user: SessionUser = {
      id: uid('user'),
      email: key,
      display_name: display_name.trim() || key.split('@')[0],
      watermark_id: `wm-${Math.random().toString(36).slice(2, 10)}`,
    };
    state.accounts[key] = { password, user };
    state.balances[user.id] = 0;
    state.user = user;
    save(state);
    return user;
  },

  login(email: string, password: string): SessionUser {
    const key = email.trim().toLowerCase();
    const acc = state.accounts[key];
    if (!acc || acc.password !== password) throw new Error('INVALID_CREDENTIALS');
    state.user = acc.user;
    save(state);
    return acc.user;
  },

  logout() {
    state.user = null;
    save(state);
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
};
