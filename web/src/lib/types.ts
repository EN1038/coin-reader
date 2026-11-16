export type WorkKind = 'novel' | 'manga';
export type Pricing = 'free' | 'coin';
export type CoverTone = 'default' | 'warm' | 'teal' | 'rose' | 'blue';

/** icon_key maps to SVG in CategoryIcon — managed from admin/backend */
export type CategoryIconKey =
  | 'book'
  | 'zap'
  | 'sparkles'
  | 'heart'
  | 'ghost'
  | 'masks'
  | 'rocket'
  | 'search';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_key: CategoryIconKey;
  sort_order: number;
  active: boolean;
}

/** Homepage hero slides — managed from admin CMS */
export interface HeroBanner {
  id: string;
  title: string;
  alt: string;
  image_url: string;
  href: string;
  sort_order: number;
  active: boolean;
}

export interface Author {
  id: string;
  display_name: string;
}

export interface Work {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  kind: WorkKind;
  category: string;
  tags: string[];
  /** 'ทั่วไป' or '18+' — badge only, not an age check */
  rating: string;
  /** published = กำลังดำเนินเรื่อง, completed = จบ */
  status: 'published' | 'completed';
  cover_tone: CoverTone;
  /** URL ปกเรื่อง — ว่างหรือโหลดไม่ได้ให้ใช้ COVER_DEFAULT */
  cover_url?: string | null;
  author_id: string;
  author_name: string;
  price_full_work: number | null;
  chapter_count: number;
  /** first N episodes are free regardless of the stored per-episode price */
  free_episode_count: number;
  views: number;
  /** จำนวนติดตาม/บุ๊คมาร์ก */
  bookmark_count: number;
  score: number;
  /** จำนวนคนให้คะแนน — แสดงเป็นไลค์บนการ์ด */
  rating_count: number;
  /** higher sorts first on /ranking tabs */
  rank_daily: number;
  rank_weekly: number;
  rank_monthly: number;
  latest_at: string;
  is_example_data: true;
  featured?: boolean;
  popular?: boolean;
  is_new?: boolean;
}

export interface Chapter {
  id: string;
  work_id: string;
  number: number;
  title: string;
  pricing: Pricing;
  coin_price: number;
  /** followers can read this paid episode without spending coins */
  follow_free?: boolean;
  published_at: string;
  status: 'published';
  is_example_data: true;
}

export interface ChapterContent {
  chapter_id: string;
  body: string;
}

export interface ChapterPage {
  chapter_id: string;
  page_number: number;
  /** mock: placeholder key; real: storage path */
  storage_path: string;
}

export interface CoinPack {
  id: string;
  name: string;
  /** paid coins, the base used for referral (bonus excluded) */
  coins: number;
  /** extra coins that are not part of the paid top-up */
  bonus_coins: number;
  amount_thb: number;
  active: boolean;
  is_example_data: true;
}

export interface SessionUser {
  id: string;
  email: string;
  display_name: string;
  watermark_id: string;
  /** Public URL or data URL for profile photo */
  avatar_url?: string | null;
}

export interface UpdateProfileInput {
  display_name: string;
  /** Compressed image blob; omit to keep current photo */
  avatar_blob?: Blob | null;
  /** Clear photo without uploading a new one */
  clear_avatar?: boolean;
}

export type CoinCurrency = 'gold' | 'diamond';

export type LedgerKind =
  | 'topup'
  | 'topup_bonus'
  | 'unlock'
  | 'unlock_work'
  | 'checkin'
  | 'referral'
  | 'tip'
  | 'diamond_earn'
  | 'diamond_payout'
  | 'diamond_to_gold';

export interface LedgerEntry {
  id: string;
  user_id?: string;
  kind: LedgerKind;
  amount: number; // signed for wallet view: +credit, -spend
  coins: number;
  /** gold = reader spendable; diamond = translator earnings */
  currency?: CoinCurrency;
  label: string;
  created_at: string;
  transaction_id: string;
}

export interface UnlockRecord {
  user_id: string;
  chapter_id: string;
  work_id: string;
  transaction_id: string | null;
  free: boolean;
}

export interface BookshelfItem {
  user_id: string;
  work_id: string;
  added_at: string;
}

export interface ReadingProgress {
  user_id: string;
  work_id: string;
  chapter_id: string;
  position: number;
  updated_at: string;
}

export interface WalletInfo {
  /** Reader spendable currency (เติม/ซื้อตอน) */
  gold: number;
  /** Translator earnings currency */
  diamond: number;
  /** Alias of gold — kept for older call sites */
  balance: number;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INSUFFICIENT_COINS'
  | 'PRICE_CHANGED'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_CONFLICT'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'MOCK_DISABLED'
  | 'ALREADY_UNLOCKED'
  | 'UNKNOWN';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  extra?: Record<string, unknown>;
  constructor(
    status: number,
    code: ApiErrorCode,
    message?: string,
    extra?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export interface UnlockResult {
  free?: boolean;
  already?: boolean;
  transaction_id?: string;
  balance: number;
  gold?: number;
  diamond?: number;
  chapter_id?: string;
  work_id?: string;
}

export interface TopupResult {
  transaction_id: string;
  balance: number;
  gold?: number;
  coins_added: number;
  bonus_added?: number;
  replayed: boolean;
}

export interface ReaderAchievementInfo {
  lifetime_topup: number;
  tier_id: string;
  tier_label: string;
  bonus_percent: number;
  next_tier_at: number | null;
}

export interface WriterAchievementInfo {
  lifetime_sales: number;
  month_sales: number;
  month_key: string;
  tier_id: string;
  tier_label: string;
  fee_bps: number;
  maintain_need: number;
}

export interface MangaPageUrl {
  page_number: number;
  url: string;
  expires_in: number;
  watermarked: boolean;
}

export interface SeriesUpdate {
  work: Work;
  episodes: Pick<Chapter, 'id' | 'number' | 'title' | 'published_at'>[];
}

export interface CheckInCalendar {
  month: string;
  today: string;
  claimed: string[];
  claimed_today: boolean;
  tickets: number;
  daily_coins: number;
  month_end_coins: number;
  month_end_tickets: number;
  days_in_month: number;
}

export interface CheckInClaim {
  already: boolean;
  coins: number;
  tickets: number;
  balance: number;
  ticket_balance: number;
  month_end: boolean;
  today: string;
}

export interface ReferralFriend {
  display_name: string;
  paid_coins: number;
  reward_coins: number;
  created_at: string;
}

export interface ReferralInfo {
  code: string;
  percent: number;
  earned_coins: number;
  friends: ReferralFriend[];
}

export interface ReaderComment {
  id: string;
  chapter_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
}

export interface RatingResult {
  score: number;
  rating_count: number;
  mine: number;
}
