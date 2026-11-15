import type {
  SessionUser, UnlockRecord, BookshelfItem, ReadingProgress, LedgerEntry, ReaderComment,
  Work, Chapter, Category, CategoryIconKey,
} from '../types';
import {
  seedWorks, seedChapters, seedContents, seedPages, seedPacks, seedAuthors, DEMO_PASSWORD,
  DEMO_REFERRAL_CODE, REFERRAL_PERCENT, seedComments, seedCategories,
} from './seed';
import { COVER_DEFAULT } from '../brand';
import { bangkokToday, checkInReward, isoDay, bangkokParts, daysInMonth } from '../format';
import {
  evaluateWriterTierDrop,
  feeBpsForWriterTier,
  monthKeyBangkok,
  readerTierForLifetime,
  writerTierForSales,
  WRITER_TIERS,
  type ReaderTierId,
  type WriterTierId,
} from '../economy/achievements';

const LS_KEY = 'stock-manga-mock-v4';

export type AgeRating = 'all' | '13' | '15' | '18';
export type SeriesStatus = 'ongoing' | 'completed';
export type ContentLanguage = 'th' | 'en';

export function ageRatingLabel(r: AgeRating): string {
  if (r === '13') return '13+';
  if (r === '15') return '15+';
  if (r === '18') return '18+';
  return 'ทั่วไป';
}

function slugify(raw: string, fallback: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0e00-\u0e7f-]/gi, '') || fallback;
}

function resolveCategoryMeta(cats: Category[], ids: string[] | undefined, fallbackName: string) {
  const picked = (ids ?? [])
    .map((id) => cats.find((c) => c.id === id))
    .filter(Boolean) as Category[];
  const names = picked.map((c) => c.name);
  const primary = names[0] ?? fallbackName ?? 'ทั่วไป';
  return { category: primary, category_ids: picked.map((c) => c.id), tags: names.length ? names : [primary] };
}

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

export type ActivityAction =
  | 'work_create'
  | 'work_update'
  | 'chapter_create'
  | 'chapter_update'
  | 'work_status'
  | 'category_upsert'
  | 'category_delete'
  | 'author_review'
  | 'takedown_review';

export type ActivityTargetType = 'work' | 'chapter' | 'category' | 'author' | 'takedown';

export interface ActivityLogEntry {
  id: string;
  at: string;
  actor_id: string;
  actor_name: string;
  action: ActivityAction;
  target_type: ActivityTargetType;
  target_id: string;
  work_id?: string;
  work_title?: string;
  summary: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  kind: 'admin_chapter' | 'system' | 'payout' | 'author';
  title: string;
  body: string;
  work_id?: string;
  chapter_id?: string;
  created_at: string;
  read: boolean;
}

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
  /** ชื่อต้นฉบับ / ชื่ออื่นสำหรับค้นหา */
  original_title: string;
  /** รายละเอียดแบบย่อ ≤140 */
  short_synopsis: string;
  synopsis: string;
  kind: 'novel' | 'manga';
  /** ชื่อหมวดหลัก (ตัวแรก) สำหรับ sync แคตตาล็อก */
  category: string;
  category_ids: string[];
  age_rating: AgeRating;
  language: ContentLanguage;
  /** สถานะเรื่อง: ยังไม่จบ / จบ */
  series_status: SeriesStatus;
  status: WorkAdminStatus;
  price_full_work: number | null;
  free_episode_count: number;
  cover_tone: 'default' | 'warm' | 'teal' | 'rose' | 'blue';
  cover_url?: string | null;
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
  /** ชื่อไฟล์รูปที่อัปโหลด (mock) */
  image_names: string[];
  /** ชื่อ ZIP สำหรับโหมดหลายตอน (mock) */
  zip_name?: string | null;
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

export interface ReaderEconomyRow {
  lifetime_topup: number;
  tier_id: ReaderTierId;
  last_bonus_tier: ReaderTierId;
}

export interface WriterEconomyRow {
  lifetime_sales: number;
  month_key: string;
  month_sales: number;
  tier_id: WriterTierId;
}

export interface MockState {
  user: SessionUser | null;
  /** email -> { password, user } */
  accounts: Record<string, { password: string; user: SessionUser; deleted?: boolean }>;
  /** Gold balances (reader spendable) — legacy field name kept for seed compatibility */
  balances: Record<string, number>;
  /** Diamond balances (translator earnings) keyed by user id */
  diamondBalances: Record<string, number>;
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
  categories: Category[];
  readerEconomy: Record<string, ReaderEconomyRow>;
  writerEconomy: Record<string, WriterEconomyRow>;
  notifications: AppNotification[];
  activityLog: ActivityLogEntry[];
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

function authorNameOf(authorId: string, registry: AuthorRecord[]): string {
  return (
    registry.find((a) => a.id === authorId)?.display_name
    ?? seedAuthors.find((a) => a.id === authorId)?.display_name
    ?? 'นักแปล'
  );
}

function seedActivityFromCatalog(
  works: WriterWork[],
  chapters: WriterChapter[],
  registry: AuthorRecord[],
): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const recentChapters = [...chapters]
    .sort((a, b) => b.number - a.number)
    .slice(0, 12);
  recentChapters.forEach((c, i) => {
    const work = works.find((w) => w.id === c.work_id);
    if (!work) return;
    const name = authorNameOf(work.author_id, registry);
    const author = registry.find((a) => a.id === work.author_id);
    entries.push({
      id: `act-seed-ch-${c.id}`,
      at: new Date(Date.now() - (i + 1) * 2.5 * 3600_000).toISOString(),
      actor_id: author?.user_id ?? work.author_id,
      actor_name: name,
      action: 'chapter_update',
      target_type: 'chapter',
      target_id: c.id,
      work_id: work.id,
      work_title: work.title,
      summary: `อัปเดตตอนที่ ${c.number} · ${work.title}`,
    });
  });
  const recentWorks = [...works]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8);
  recentWorks.forEach((w, i) => {
    const name = authorNameOf(w.author_id, registry);
    const author = registry.find((a) => a.id === w.author_id);
    entries.push({
      id: `act-seed-w-${w.id}`,
      at: new Date(Date.now() - (i + 1) * 5 * 3600_000).toISOString(),
      actor_id: author?.user_id ?? w.author_id,
      actor_name: name,
      action: 'work_update',
      target_type: 'work',
      target_id: w.id,
      work_id: w.id,
      work_title: w.title,
      summary: `อัปเดตเรื่อง · ${w.title}`,
    });
  });
  return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
}

function seedWriterCatalog(): { works: WriterWork[]; chapters: WriterChapter[] } {
  const now = nowIso();
  const works: WriterWork[] = seedWorks
    .filter((w) => w.author_id === 'a-001')
    .map((w) => {
      const legacy: Record<string, string> = {
        โรแมนติก: 'romance', สยองขวัญ: 'horror', ดราม่า: 'drama', แฟนตาซี: 'fantasy',
        ไซไฟ: 'sci-fi', แอ็กชัน: 'action', ลึกลับ: 'mystery',
      };
      const want = legacy[w.category] ?? w.category.toLowerCase();
      const match = seedCategories.find(
        (c) => c.slug === want || c.name.includes(w.category) || c.name === w.category,
      );
      const cat = match ?? seedCategories.find((c) => c.slug === 'romance') ?? seedCategories[0];
      return {
        id: w.id,
        author_id: w.author_id,
        slug: w.slug,
        title: w.title,
        original_title: w.title,
        short_synopsis: w.synopsis.slice(0, 140),
        synopsis: w.synopsis,
        kind: w.kind,
        category: cat?.name ?? w.category,
        category_ids: cat ? [cat.id] : [],
        age_rating: (w.rating === '18+' ? '18' : 'all') as AgeRating,
        language: 'th' as ContentLanguage,
        series_status: (w.status === 'completed' ? 'completed' : 'ongoing') as SeriesStatus,
        status: 'published' as WorkAdminStatus,
        price_full_work: w.price_full_work,
        free_episode_count: w.free_episode_count,
        cover_tone: w.cover_tone,
        cover_url: w.cover_url ?? COVER_DEFAULT,
        created_at: now,
        updated_at: now,
        is_example_data: true as const,
      };
    });
  const chapters: WriterChapter[] = seedChapters
    .filter((c) => works.some((w) => w.id === c.work_id))
    .map((c) => {
      const content = seedContents.find((x) => x.chapter_id === c.id);
      const pages = c.work_id.startsWith('w-') && seedWorks.find((w) => w.id === c.work_id)?.kind === 'manga' ? 3 : 0;
      return {
        id: c.id,
        work_id: c.work_id,
        number: c.number,
        title: c.title,
        pricing: c.pricing,
        coin_price: c.coin_price,
        follow_free: !!c.follow_free,
        status: 'published' as const,
        body: content?.body ?? '',
        page_count: pages,
        image_names: pages > 0 ? Array.from({ length: pages }, (_, i) => `${i + 1}.jpg`) : [],
        zip_name: null,
        updated_at: now,
        is_example_data: true as const,
      };
    });
  return { works, chapters };
}

function earningsOf(sales: number, tips: number, pending = 0, feeBps = 1000): WriterEarningsFixture {
  const gross = sales + tips;
  const fee = Math.floor((gross * feeBps) / 10000);
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
    diamondBalances: { [writerUser.id]: 520, [demoUser.id]: 0, [friendUser.id]: 0 },
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
      [writerUser.id]: { code: 'SMWRITER' },
      [friendUser.id]: { code: 'SMFRIEND', referred_by: demoUser.id },
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
    categories: seedCategories.map((c) => ({ ...c })),
    readerEconomy: {
      [demoUser.id]: { lifetime_topup: topupCoins, tier_id: 'none', last_bonus_tier: 'none' },
      [friendUser.id]: { lifetime_topup: 0, tier_id: 'none', last_bonus_tier: 'none' },
      [writerUser.id]: { lifetime_topup: 0, tier_id: 'none', last_bonus_tier: 'none' },
    },
    writerEconomy: {
      [writerUser.id]: {
        lifetime_sales: 5500,
        month_key: monthKeyBangkok(),
        month_sales: 800,
        tier_id: 'plus',
      },
    },
    notifications: [],
    activityLog: seedActivityFromCatalog(catalog.works, catalog.chapters, [
      {
        id: 'a-001',
        user_id: writerUser.id,
        display_name: 'นามปากกาตัวอย่าง',
        bio: '',
        status: 'approved',
        created_at: now,
        approved_at: now,
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
    ]),
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
    diamondBalances: { ...base.diamondBalances, ...(parsed.diamondBalances ?? {}) },
    readerEconomy: { ...base.readerEconomy, ...(parsed.readerEconomy ?? {}) },
    writerEconomy: { ...base.writerEconomy, ...(parsed.writerEconomy ?? {}) },
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
    categories: parsed.categories?.length ? parsed.categories : base.categories,
    notifications: parsed.notifications ?? [],
    activityLog: parsed.activityLog?.length
      ? parsed.activityLog
      : seedActivityFromCatalog(
          parsed.writerWorks?.length ? parsed.writerWorks : base.writerWorks,
          parsed.writerChapters?.length ? parsed.writerChapters : base.writerChapters,
          parsed.authorsRegistry?.length ? parsed.authorsRegistry : base.authorsRegistry,
        ),
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

  listCategories(activeOnly = true): Category[] {
    return state.categories
      .filter((c) => (activeOnly ? c.active : true))
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'th'));
  },

  pushActivityLog(
    input: Omit<ActivityLogEntry, 'id' | 'at'> & { id?: string; at?: string },
  ): ActivityLogEntry {
    const row: ActivityLogEntry = {
      id: input.id ?? uid('act'),
      at: input.at ?? nowIso(),
      actor_id: input.actor_id,
      actor_name: input.actor_name,
      action: input.action,
      target_type: input.target_type,
      target_id: input.target_id,
      work_id: input.work_id,
      work_title: input.work_title,
      summary: input.summary,
    };
    state.activityLog = [row, ...state.activityLog].slice(0, 500);
    return row;
  },

  listActivityLog(params?: {
    q?: string;
    action?: ActivityAction | 'all';
    limit?: number;
  }): ActivityLogEntry[] {
    const q = params?.q?.trim().toLowerCase() ?? '';
    const action = params?.action && params.action !== 'all' ? params.action : null;
    const limit = params?.limit ?? 200;
    return state.activityLog
      .filter((e) => (action ? e.action === action : true))
      .filter((e) => {
        if (!q) return true;
        return (
          e.summary.toLowerCase().includes(q)
          || e.actor_name.toLowerCase().includes(q)
          || (e.work_title ?? '').toLowerCase().includes(q)
          || e.action.toLowerCase().includes(q)
        );
      })
      .slice(0, limit);
  },

  upsertCategory(input: {
    id?: string;
    name: string;
    slug: string;
    icon_key: CategoryIconKey;
    sort_order: number;
    active: boolean;
  }): Category {
    const name = input.name.trim();
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !slug) throw new Error('VALIDATION');
    const dup = state.categories.find(
      (c) => c.id !== input.id && (c.name === name || c.slug === slug),
    );
    if (dup) throw new Error('CONFLICT');
    const actor = state.user
      ? { id: state.user.id, name: state.user.display_name || 'แอดมิน' }
      : { id: 'admin', name: 'แอดมิน' };
    if (input.id) {
      const idx = state.categories.findIndex((c) => c.id === input.id);
      if (idx < 0) throw new Error('NOT_FOUND');
      const next: Category = {
        ...state.categories[idx],
        name,
        slug,
        icon_key: input.icon_key,
        sort_order: input.sort_order,
        active: input.active,
      };
      state.categories[idx] = next;
      mockDb.pushActivityLog({
        actor_id: actor.id,
        actor_name: actor.name,
        action: 'category_upsert',
        target_type: 'category',
        target_id: next.id,
        summary: `แก้ไขหมวด · ${next.name}`,
      });
      save(state);
      return next;
    }
    const created: Category = {
      id: uid('cat'),
      name,
      slug,
      icon_key: input.icon_key,
      sort_order: input.sort_order,
      active: input.active,
    };
    state.categories.push(created);
    mockDb.pushActivityLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'category_upsert',
      target_type: 'category',
      target_id: created.id,
      summary: `สร้างหมวด · ${created.name}`,
    });
    save(state);
    return created;
  },

  deleteCategory(id: string) {
    const cat = state.categories.find((c) => c.id === id);
    const before = state.categories.length;
    state.categories = state.categories.filter((c) => c.id !== id);
    if (state.categories.length === before) throw new Error('NOT_FOUND');
    const actor = state.user
      ? { id: state.user.id, name: state.user.display_name || 'แอดมิน' }
      : { id: 'admin', name: 'แอดมิน' };
    mockDb.pushActivityLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'category_delete',
      target_type: 'category',
      target_id: id,
      summary: `ลบหมวด · ${cat?.name ?? id}`,
    });
    save(state);
  },

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

  goldOf(userId: string): number {
    return mockDb.balanceOf(userId);
  },

  diamondOf(userId: string): number {
    return state.diamondBalances[userId] ?? 0;
  },

  setBalance(userId: string, n: number) {
    state.balances[userId] = n;
    save(state);
  },

  setDiamond(userId: string, n: number) {
    state.diamondBalances[userId] = n;
    save(state);
  },

  walletOf(userId: string) {
    const gold = mockDb.goldOf(userId);
    const diamond = mockDb.diamondOf(userId);
    return { gold, diamond, balance: gold };
  },

  addLedger(entry: Omit<LedgerEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }) {
    const full: LedgerEntry = {
      id: entry.id ?? uid('led'),
      user_id: entry.user_id ?? state.user?.id,
      created_at: entry.created_at ?? nowIso(),
      kind: entry.kind,
      amount: entry.amount,
      coins: entry.coins,
      currency: entry.currency ?? (entry.kind.startsWith('diamond') ? 'diamond' : 'gold'),
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
    if (state.diamondBalances[user.id] == null) state.diamondBalances[user.id] = 0;
    if (state.tickets[user.id] == null) state.tickets[user.id] = 0;
    if (!state.readerEconomy[user.id]) {
      state.readerEconomy[user.id] = { lifetime_topup: 0, tier_id: 'none', last_bonus_tier: 'none' };
    }
    state.referrals[user.id] = {
      code: `SM${user.id.replace(/\W/g, '').slice(-6).toUpperCase()}`,
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
    /** writer keeps 90% at base tier (platform 10%) */
    writer_share_bps: 9000,
    platform_fee_bps: 1000,
    hold_days: 14,
    minimum_payout: 500,
    diamond_to_gold_rate: 1,
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
    const actor = state.user
      ? { id: state.user.id, name: state.user.display_name || 'แอดมิน' }
      : { id: 'admin', name: 'แอดมิน' };
    mockDb.pushActivityLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'author_review',
      target_type: 'author',
      target_id: authorId,
      summary: `${decision === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}นักแปล · ${row.display_name}`,
    });
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
    const author = state.authorsRegistry.find((a) => a.id === input.author_id);
    const actorName = authorNameOf(input.author_id, state.authorsRegistry);
    const actorId = author?.user_id ?? input.author_id;
    if (input.id) {
      const i = state.writerWorks.findIndex((w) => w.id === input.id);
      if (i < 0) throw new Error('NOT_FOUND');
      const prev = state.writerWorks[i];
      const catMeta = resolveCategoryMeta(
        state.categories,
        input.category_ids ?? prev.category_ids,
        input.category ?? prev.category,
      );
      const next: WriterWork = {
        ...prev,
        ...input,
        title: input.title.trim(),
        original_title: (input.original_title ?? prev.original_title ?? input.title).trim(),
        short_synopsis: (input.short_synopsis ?? prev.short_synopsis ?? '').trim().slice(0, 140),
        synopsis: (input.synopsis ?? prev.synopsis).trim(),
        slug: slugify(input.slug ?? prev.slug, prev.id),
        category: catMeta.category,
        category_ids: catMeta.category_ids,
        age_rating: input.age_rating ?? prev.age_rating ?? 'all',
        language: input.language ?? prev.language ?? 'th',
        series_status: input.series_status ?? prev.series_status ?? 'ongoing',
        updated_at: now,
        is_example_data: true,
      };
      state.writerWorks[i] = next;
      mockDb.pushActivityLog({
        actor_id: actorId,
        actor_name: actorName,
        action: 'work_update',
        target_type: 'work',
        target_id: next.id,
        work_id: next.id,
        work_title: next.title,
        summary: `อัปเดตเรื่อง · ${next.title}`,
      });
      save(state);
      mockDb.syncReaderCatalog();
      return next;
    }
    const id = uid('ww');
    const slug = slugify(input.slug || input.title, id);
    const catMeta = resolveCategoryMeta(state.categories, input.category_ids, input.category ?? 'ทั่วไป');
    const row: WriterWork = {
      id,
      author_id: input.author_id,
      slug,
      title: input.title.trim(),
      original_title: (input.original_title ?? input.title).trim(),
      short_synopsis: (input.short_synopsis ?? '').trim().slice(0, 140),
      synopsis: (input.synopsis ?? '').trim(),
      kind: input.kind,
      category: catMeta.category,
      category_ids: catMeta.category_ids,
      age_rating: input.age_rating ?? 'all',
      language: input.language ?? 'th',
      series_status: input.series_status ?? 'ongoing',
      status: input.status ?? 'draft',
      price_full_work: input.price_full_work ?? null,
      free_episode_count: input.free_episode_count ?? 0,
      cover_tone: input.cover_tone ?? 'default',
      cover_url: input.cover_url ?? COVER_DEFAULT,
      created_at: now,
      updated_at: now,
      is_example_data: true,
    };
    state.writerWorks = [row, ...state.writerWorks];
    mockDb.pushActivityLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'work_create',
      target_type: 'work',
      target_id: row.id,
      work_id: row.id,
      work_title: row.title,
      summary: `สร้างเรื่อง · ${row.title}`,
    });
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

  saveWriterChapter(input: Partial<WriterChapter> & { work_id: string; title?: string }): WriterChapter {
    const now = nowIso();
    const coinPrice = Math.max(0, Math.floor(input.coin_price ?? 0));
    const pricing: 'free' | 'coin' = input.pricing ?? (coinPrice > 0 ? 'coin' : 'free');
    const resolvedPrice = pricing === 'coin' ? (coinPrice || input.coin_price || 1) : 0;
    const work = state.writerWorks.find((w) => w.id === input.work_id);
    const authorId = work?.author_id ?? '';
    const author = state.authorsRegistry.find((a) => a.id === authorId);
    const actorName = authorNameOf(authorId, state.authorsRegistry);
    const actorId = author?.user_id ?? (authorId || 'writer');
    if (input.id) {
      const i = state.writerChapters.findIndex((c) => c.id === input.id);
      if (i < 0) throw new Error('NOT_FOUND');
      const prev = state.writerChapters[i];
      const next: WriterChapter = {
        ...prev,
        ...input,
        title: (input.title ?? prev.title ?? '').trim() || `ตอนที่ ${input.number ?? prev.number}`,
        number: input.number ?? prev.number,
        pricing,
        coin_price: resolvedPrice,
        follow_free: pricing === 'coin' && !!(input.follow_free ?? prev.follow_free),
        body: input.body ?? prev.body,
        page_count: input.page_count ?? prev.page_count,
        image_names: input.image_names ?? prev.image_names ?? [],
        zip_name: input.zip_name !== undefined ? input.zip_name : prev.zip_name,
        updated_at: now,
        is_example_data: true,
      };
      state.writerChapters[i] = next;
      mockDb.pushActivityLog({
        actor_id: actorId,
        actor_name: actorName,
        action: 'chapter_update',
        target_type: 'chapter',
        target_id: next.id,
        work_id: next.work_id,
        work_title: work?.title,
        summary: `อัปเดตตอนที่ ${next.number} · ${work?.title ?? next.work_id}`,
      });
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
      title: (input.title ?? '').trim() || `ตอนที่ ${number}`,
      pricing,
      coin_price: resolvedPrice,
      follow_free: pricing === 'coin' && !!input.follow_free,
      status: input.status ?? 'draft',
      body: input.body ?? '',
      page_count: input.page_count ?? (input.image_names?.length ?? 0),
      image_names: input.image_names ?? [],
      zip_name: input.zip_name ?? null,
      updated_at: now,
      is_example_data: true,
    };
    state.writerChapters = [...state.writerChapters, row];
    const wi = state.writerWorks.findIndex((w) => w.id === input.work_id);
    if (wi >= 0) state.writerWorks[wi] = { ...state.writerWorks[wi], updated_at: now };
    mockDb.pushActivityLog({
      actor_id: actorId,
      actor_name: actorName,
      action: 'chapter_create',
      target_type: 'chapter',
      target_id: row.id,
      work_id: row.work_id,
      work_title: work?.title,
      summary: `สร้างตอนที่ ${row.number} · ${work?.title ?? row.work_id}`,
    });
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
    const diamond = mockDb.diamondOf(author.user_id);
    if (diamond < amount) throw new Error('INSUFFICIENT_DIAMOND');
    const tx = mockDb.newTxId();
    const row: PayoutRequest = {
      id: uid('po'),
      author_id: authorId,
      amount,
      bank_document_id: bankDocumentId,
      status: 'pending',
      created_at: nowIso(),
      transaction_id: tx,
    };
    state.payoutRequests = [row, ...state.payoutRequests];
    earnings.available -= amount;
    earnings.reserved += amount;
    mockDb.setDiamond(author.user_id, diamond - amount);
    mockDb.addLedger({
      user_id: author.user_id,
      kind: 'diamond_payout',
      amount: -amount,
      coins: amount,
      currency: 'diamond',
      label: `ขอถอน ${amount} Diamond (ขั้นต่ำ ${mockDb.WRITER_POLICY.minimum_payout})`,
      transaction_id: tx,
    });
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
      const author = state.authorsRegistry.find((a) => a.id === row.author_id);
      if (author) {
        mockDb.setDiamond(author.user_id, mockDb.diamondOf(author.user_id) + row.amount);
      }
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
    let workTitle: string | undefined;
    if (decision === 'resolved' && row.work_id) {
      const wi = state.writerWorks.findIndex((w) => w.id === row.work_id);
      if (wi >= 0) {
        state.writerWorks[wi] = { ...state.writerWorks[wi], status: 'takedown', updated_at: nowIso() };
        workTitle = state.writerWorks[wi].title;
      }
    }
    const actor = state.user
      ? { id: state.user.id, name: state.user.display_name || 'แอดมิน' }
      : { id: 'admin', name: 'แอดมิน' };
    mockDb.pushActivityLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'takedown_review',
      target_type: 'takedown',
      target_id: id,
      work_id: row.work_id,
      work_title: workTitle,
      summary: `Takedown ${decision}${workTitle ? ` · ${workTitle}` : ''}`,
    });
    save(state);
    return state.takedownRequests[i];
  },

  setWriterWorkStatus(
    workId: string,
    status: WorkAdminStatus,
    actor?: { id: string; name: string },
  ) {
    const i = state.writerWorks.findIndex((w) => w.id === workId);
    if (i < 0) throw new Error('NOT_FOUND');
    const prev = state.writerWorks[i];
    state.writerWorks[i] = { ...prev, status, updated_at: nowIso() };
    const who = actor
      ?? (state.user
        ? { id: state.user.id, name: state.user.display_name || 'แอดมิน' }
        : { id: 'admin', name: 'แอดมิน' });
    mockDb.pushActivityLog({
      actor_id: who.id,
      actor_name: who.name,
      action: 'work_status',
      target_type: 'work',
      target_id: workId,
      work_id: workId,
      work_title: prev.title,
      summary: `เปลี่ยนสถานะเป็น ${status} · ${prev.title}`,
    });
    save(state);
    return state.writerWorks[i];
  },

  syncReaderCatalog() {
    for (const w of state.writerWorks) {
      if (w.status !== 'published') continue;
      const catMeta = resolveCategoryMeta(state.categories, w.category_ids, w.category);
      const synopsis = [w.short_synopsis, w.synopsis].filter(Boolean).join('\n\n') || w.synopsis;
      const rating = ageRatingLabel(w.age_rating ?? 'all');
      const seriesStatus = w.series_status === 'completed' ? 'completed' : 'published';
      const idx = mockDb.works.findIndex((x) => x.id === w.id);
      if (idx >= 0) {
        mockDb.works[idx] = {
          ...mockDb.works[idx],
          title: w.title,
          synopsis,
          slug: w.slug,
          category: catMeta.category,
          tags: catMeta.tags,
          rating,
          status: seriesStatus,
          kind: w.kind,
          free_episode_count: w.free_episode_count ?? mockDb.works[idx].free_episode_count,
          price_full_work: w.price_full_work,
          cover_url: w.cover_url ?? mockDb.works[idx].cover_url ?? COVER_DEFAULT,
          author_id: w.author_id,
        };
      } else {
        const author = state.authorsRegistry.find((a) => a.id === w.author_id);
        mockDb.works.unshift({
          id: w.id,
          slug: w.slug,
          title: w.title,
          synopsis,
          kind: w.kind,
          category: catMeta.category,
          tags: catMeta.tags,
          rating,
          status: seriesStatus,
          cover_tone: w.cover_tone,
          cover_url: w.cover_url ?? COVER_DEFAULT,
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
    const profile = state.referrals[userId] ?? { code: `SM${userId.slice(-6).toUpperCase()}` };
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
    const isWorkThread = chapterId.startsWith('work:');
    if (!isWorkThread && !mockDb.canRead(userId, chapterId)) throw new Error('UNAUTHORIZED');
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

  /** คอมเมนต์โซนหน้า detail เรื่อง + คอมเมนต์รายตอนของเรื่องนั้น */
  listWorkComments(workId: string, userId?: string): ReaderComment[] {
    const chapterIds = new Set([
      `work:${workId}`,
      ...mockDb.chapters.filter((c) => c.work_id === workId).map((c) => c.id),
      ...state.writerChapters.filter((c) => c.work_id === workId).map((c) => c.id),
    ]);
    return state.comments
      .filter((c) => chapterIds.has(c.chapter_id))
      .map((c) => ({
        ...c,
        like_count: state.commentLikes.filter((l) => l.comment_id === c.id).length,
        liked_by_me: !!userId && state.commentLikes.some((l) => l.comment_id === c.id && l.user_id === userId),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  addWorkComment(userId: string, workId: string, body: string): ReaderComment {
    return mockDb.addComment(userId, `work:${workId}`, body);
  },

  listNotifications(userId: string): AppNotification[] {
    return state.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  unreadNotificationCount(userId: string): number {
    return state.notifications.filter((n) => n.user_id === userId && !n.read).length;
  },

  markNotificationsRead(userId: string) {
    let changed = false;
    state.notifications = state.notifications.map((n) => {
      if (n.user_id === userId && !n.read) {
        changed = true;
        return { ...n, read: true };
      }
      return n;
    });
    if (changed) save(state);
  },

  notifyUser(input: {
    user_id: string;
    kind: AppNotification['kind'];
    title: string;
    body: string;
    work_id?: string;
    chapter_id?: string;
  }): AppNotification {
    const row: AppNotification = {
      id: uid('ntf'),
      user_id: input.user_id,
      kind: input.kind,
      title: input.title.trim(),
      body: input.body.trim(),
      work_id: input.work_id,
      chapter_id: input.chapter_id,
      created_at: nowIso(),
      read: false,
    };
    state.notifications = [row, ...state.notifications];
    save(state);
    return row;
  },

  /** แอดมินแจ้งนักแปลว่าตอนมีปัญหา */
  notifyWriterChapterIssue(input: {
    author_id: string;
    work_id: string;
    chapter_id?: string;
    message: string;
  }): AppNotification {
    const author = state.authorsRegistry.find((a) => a.id === input.author_id);
    if (!author) throw new Error('NOT_FOUND');
    const work = state.writerWorks.find((w) => w.id === input.work_id) ?? mockDb.works.find((w) => w.id === input.work_id);
    const chapter = input.chapter_id
      ? state.writerChapters.find((c) => c.id === input.chapter_id) ?? mockDb.chapters.find((c) => c.id === input.chapter_id)
      : undefined;
    const title = chapter
      ? `แจ้งปัญหาตอน · ${work?.title ?? 'เรื่อง'} ตอนที่ ${(chapter as { number?: number }).number ?? '?'}`
      : `แจ้งปัญหาเรื่อง · ${work?.title ?? 'เรื่อง'}`;
    return mockDb.notifyUser({
      user_id: author.user_id,
      kind: 'admin_chapter',
      title,
      body: input.message.trim() || 'แอดมินแจ้งว่ามีปัญหา กรุณาตรวจสอบ',
      work_id: input.work_id,
      chapter_id: input.chapter_id,
    });
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

  ensureWriterEconomy(userId: string): WriterEconomyRow {
    const mk = monthKeyBangkok();
    const row = state.writerEconomy[userId];
    if (!row) {
      const created: WriterEconomyRow = {
        lifetime_sales: 0,
        month_key: mk,
        month_sales: 0,
        tier_id: 'base',
      };
      state.writerEconomy[userId] = created;
      return created;
    }
    if (row.month_key !== mk) {
      row.tier_id = evaluateWriterTierDrop(row.tier_id, row.month_sales);
      row.month_key = mk;
      row.month_sales = 0;
    }
    return row;
  },

  ensureReaderEconomy(userId: string): ReaderEconomyRow {
    if (!state.readerEconomy[userId]) {
      state.readerEconomy[userId] = { lifetime_topup: 0, tier_id: 'none', last_bonus_tier: 'none' };
    }
    return state.readerEconomy[userId];
  },

  /**
   * Credit translator Diamond from a Gold spend (unlock/tip).
   * Fee follows writer achievement tier (base 10%).
   */
  creditWriterSale(opts: {
    authorId: string;
    goldSpent: number;
    kind: 'sales' | 'tip';
    tx: string;
    label: string;
  }) {
    const author = state.authorsRegistry.find((a) => a.id === opts.authorId);
    const writerUserId = author?.user_id;
    const eco = writerUserId
      ? mockDb.ensureWriterEconomy(writerUserId)
      : ({ lifetime_sales: 0, month_key: monthKeyBangkok(), month_sales: 0, tier_id: 'base' } as WriterEconomyRow);

    if (writerUserId) {
      eco.lifetime_sales += opts.goldSpent;
      eco.month_sales += opts.goldSpent;
      const bySales = writerTierForSales(eco.lifetime_sales);
      const tierOrder = ['base', 'plus', 'pro', 'elite'] as WriterTierId[];
      if (tierOrder.indexOf(bySales.id) > tierOrder.indexOf(eco.tier_id)) {
        eco.tier_id = bySales.id;
      }
      state.writerEconomy[writerUserId] = eco;
    }

    const feeBps = feeBpsForWriterTier(eco.tier_id);
    const fee = Math.floor((opts.goldSpent * feeBps) / 10000);
    const net = opts.goldSpent - fee;

    const earnings = state.writerEarnings[opts.authorId] ?? {
      pending: 0, available: 0, reserved: 0, paid: 0, unlock_count: 0, views_label: '0',
      sales_coins: 0, tip_coins: 0, platform_fee_coins: 0, net_coins: 0,
    };
    const alreadyDrawn = Math.max(0, earnings.net_coins - earnings.available - earnings.reserved);
    if (opts.kind === 'tip') earnings.tip_coins += opts.goldSpent;
    else {
      earnings.sales_coins += opts.goldSpent;
      earnings.unlock_count += 1;
    }
    const gross = earnings.sales_coins + earnings.tip_coins;
    earnings.platform_fee_coins = Math.floor((gross * feeBps) / 10000);
    earnings.net_coins = gross - earnings.platform_fee_coins;
    earnings.available = Math.max(0, earnings.net_coins - earnings.reserved - alreadyDrawn);
    state.writerEarnings[opts.authorId] = earnings;

    if (writerUserId && net > 0) {
      const nextDiamond = mockDb.diamondOf(writerUserId) + net;
      mockDb.setDiamond(writerUserId, nextDiamond);
      mockDb.addLedger({
        user_id: writerUserId,
        kind: 'diamond_earn',
        amount: net,
        coins: net,
        currency: 'diamond',
        label: opts.label,
        transaction_id: opts.tx,
      });
    }
    save(state);
    return { fee, net, feeBps };
  },

  /** Apply paid top-up Gold + lifetime achievement bonus when crossing tiers */
  applyGoldTopup(userId: string, paidCoins: number, bonusCoins: number, tx: string) {
    const totalPack = paidCoins + bonusCoins;
    const eco = mockDb.ensureReaderEconomy(userId);
    const before = eco.lifetime_topup;
    eco.lifetime_topup += paidCoins;
    const tier = readerTierForLifetime(eco.lifetime_topup);
    eco.tier_id = tier.id;

    let achievementBonus = 0;
    const crossed = readerTierForLifetime(before).id !== tier.id && tier.bonusPercent > 0
      && eco.last_bonus_tier !== tier.id;
    // Bonus is % of cumulative lifetime when first reaching a new tier (team note: 1000 → +1% = 10)
    if (crossed || (tier.bonusPercent > 0 && eco.last_bonus_tier !== tier.id && before < tier.minLifetime && eco.lifetime_topup >= tier.minLifetime)) {
      achievementBonus = Math.floor((eco.lifetime_topup * tier.bonusPercent) / 100);
      eco.last_bonus_tier = tier.id;
    }

    const credit = totalPack + achievementBonus;
    const next = mockDb.goldOf(userId) + credit;
    mockDb.setBalance(userId, next);
    mockDb.addLedger({
      user_id: userId,
      kind: 'topup',
      amount: totalPack,
      coins: totalPack,
      currency: 'gold',
      label: bonusCoins > 0
        ? `เติม ${paidCoins} Gold + โบนัสแพ็ก ${bonusCoins} (mock)`
        : `เติม ${paidCoins} Gold (mock)`,
      transaction_id: tx,
    });
    if (achievementBonus > 0) {
      mockDb.addLedger({
        user_id: userId,
        kind: 'topup_bonus',
        amount: achievementBonus,
        coins: achievementBonus,
        currency: 'gold',
        label: `โบนัสระดับ ${tier.label} +${tier.bonusPercent}% (${achievementBonus} Gold)`,
        transaction_id: tx,
      });
    }
    state.readerEconomy[userId] = eco;
    save(state);
    return { credit, achievementBonus, gold: next, tier };
  },

  convertDiamondToGold(userId: string, amount: number) {
    if (!Number.isInteger(amount) || amount < 1) throw new Error('VALIDATION');
    const diamond = mockDb.diamondOf(userId);
    if (diamond < amount) throw new Error('INSUFFICIENT_DIAMOND');
    const tx = mockDb.newTxId();
    mockDb.setDiamond(userId, diamond - amount);
    mockDb.setBalance(userId, mockDb.goldOf(userId) + amount);
    mockDb.addLedger({
      user_id: userId,
      kind: 'diamond_to_gold',
      amount: -amount,
      coins: amount,
      currency: 'diamond',
      label: `แลก ${amount} Diamond → Gold (1:1)`,
      transaction_id: tx,
    });
    mockDb.addLedger({
      user_id: userId,
      kind: 'diamond_to_gold',
      amount: amount,
      coins: amount,
      currency: 'gold',
      label: `ได้รับ ${amount} Gold จากแลก Diamond`,
      transaction_id: tx,
    });
    const author = state.authorsRegistry.find((a) => a.user_id === userId);
    if (author) {
      const earnings = state.writerEarnings[author.id];
      if (earnings) {
        const take = Math.min(amount, earnings.available);
        earnings.available -= take;
        earnings.net_coins = Math.max(0, earnings.net_coins - take);
      }
    }
    save(state);
    return mockDb.walletOf(userId);
  },

  readerAchievement(userId: string) {
    const eco = mockDb.ensureReaderEconomy(userId);
    const tier = readerTierForLifetime(eco.lifetime_topup);
    const tiers = [500, 1000, 3000, 10000];
    const next = tiers.find((n) => n > eco.lifetime_topup) ?? null;
    return {
      lifetime_topup: eco.lifetime_topup,
      tier_id: tier.id,
      tier_label: tier.label,
      bonus_percent: tier.bonusPercent,
      next_tier_at: next,
    };
  },

  writerAchievement(userId: string) {
    const eco = mockDb.ensureWriterEconomy(userId);
    const active = WRITER_TIERS.find((t) => t.id === eco.tier_id) ?? WRITER_TIERS[0];
    const maintain = active.minSales > 0 ? Math.ceil(active.minSales * 0.25) : 0;
    return {
      lifetime_sales: eco.lifetime_sales,
      month_sales: eco.month_sales,
      month_key: eco.month_key,
      tier_id: eco.tier_id,
      tier_label: active.label,
      fee_bps: feeBpsForWriterTier(eco.tier_id),
      maintain_need: maintain,
    };
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
      currency: 'gold',
      label: `สนับสนุนนักเขียน · ${work.title}`,
      transaction_id: tx,
    });
    mockDb.creditWriterSale({
      authorId: work.author_id,
      goldSpent: coins,
      kind: 'tip',
      tx,
      label: `ทิปจากผู้อ่าน · ${work.title}`,
    });
    save(state);
    return { balance: next, gold: next, diamond: mockDb.diamondOf(userId), transaction_id: tx };
  },

  adminSummary() {
    const today = bangkokToday();
    const goldLiability = Object.values(state.balances).reduce((s, n) => s + (n || 0), 0);
    const diamondOutstanding = Object.values(state.diamondBalances).reduce((s, n) => s + (n || 0), 0);

    let topupToday = 0;
    let gmvToday = 0;
    for (const e of state.ledger) {
      const day = bangkokToday(new Date(e.created_at));
      if (day !== today) continue;
      if (e.kind === 'topup' || e.kind === 'topup_bonus') topupToday += Math.abs(e.coins || e.amount || 0);
      if (e.kind === 'unlock' || e.kind === 'unlock_work' || e.kind === 'tip') {
        gmvToday += Math.abs(e.coins || e.amount || 0);
      }
    }

    const publishedWorks = state.writerWorks.filter((w) => w.status === 'published');
    const publishedChapters = state.writerChapters.filter((c) => c.status === 'published');
    const viewsTotal = mockDb.works.reduce((s, w) => s + (w.views || 0), 0);

    const authors_pending = state.authorsRegistry.filter((a) => a.status === 'pending').length;
    const reports_open = state.helpReports.filter((r) => r.status === 'open').length;
    const takedowns_open = state.takedownRequests.filter((r) => r.status === 'received' || r.status === 'reviewing').length;
    const payouts_pending = state.payoutRequests.filter((p) => p.status === 'pending').length;

    return {
      gold_liability: goldLiability,
      diamond_outstanding: diamondOutstanding,
      topup_today: topupToday,
      gmv_today: gmvToday,
      works_published: publishedWorks.length,
      works_total: state.writerWorks.length,
      chapters_published: publishedChapters.length,
      views_total: viewsTotal,
      authors_pending,
      reports_open,
      takedowns_open,
      payouts_pending,
      categories_active: state.categories.filter((c) => c.active).length,
      ledger_count: state.ledger.length,
      // legacy labels for any old callers
      topup_today_label: topupToday.toLocaleString('th-TH'),
      liability_label: goldLiability.toLocaleString('th-TH'),
      works_count: state.writerWorks.length,
    };
  },
};

mockDb.syncReaderCatalog();
