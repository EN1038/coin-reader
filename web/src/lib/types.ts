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
  rating: string;
  status: 'published' | 'completed';
  cover_tone: CoverTone;
  author_id: string;
  author_name: string;
  price_full_work: number | null;
  chapter_count: number;
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
  coins: number;
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

export interface LedgerEntry {
  id: string;
  kind: 'topup' | 'unlock' | 'unlock_work';
  amount: number; // signed for wallet view: +topup, -spend
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
