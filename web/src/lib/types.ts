export type WorkKind = 'novel' | 'manga';
export type Pricing = 'free' | 'coin';
export type CoverTone = 'default' | 'warm' | 'teal' | 'rose' | 'blue';

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
  author_id: string;
  author_name: string;
  price_full_work: number | null;
  chapter_count: number;
  /** first N episodes are free regardless of the stored per-episode price */
  free_episode_count: number;
  views: number;
  score: number;
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
}

export type LedgerKind = 'topup' | 'unlock' | 'unlock_work' | 'checkin' | 'referral' | 'tip';

export interface LedgerEntry {
  id: string;
  user_id?: string;
  kind: LedgerKind;
  amount: number; // signed for wallet view: +credit, -spend
  coins: number;
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
  balance: number;
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'INSUFFICIENT_COINS'
  | 'PRICE_CHANGED'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_CONFLICT'
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
  chapter_id?: string;
  work_id?: string;
}

export interface TopupResult {
  transaction_id: string;
  balance: number;
  coins_added: number;
  replayed: boolean;
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
