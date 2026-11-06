import type {
  Work, Chapter, ChapterContent, CoinPack, SessionUser, WalletInfo,
  LedgerEntry, UnlockResult, TopupResult, MangaPageUrl, BookshelfItem,
  ReadingProgress,
} from './types';

export interface ListWorksParams {
  kind?: 'novel' | 'manga';
  category?: string;
  q?: string;
  popular?: boolean;
  isNew?: boolean;
  featured?: boolean;
}

export interface CoinReaderApi {
  isMock: boolean;
  getSession(): Promise<SessionUser | null>;
  login(email: string, password: string): Promise<SessionUser>;
  signup(email: string, password: string, displayName: string): Promise<SessionUser>;
  logout(): Promise<void>;
  listWorks(params?: ListWorksParams): Promise<Work[]>;
  getWorkBySlug(slug: string): Promise<Work>;
  getWork(id: string): Promise<Work>;
  listChapters(workId: string): Promise<Chapter[]>;
  getChapter(chapterId: string): Promise<Chapter>;
  getChapterContent(chapterId: string): Promise<ChapterContent>;
  listPacks(): Promise<CoinPack[]>;
  myWallet(): Promise<WalletInfo>;
  listLedger(): Promise<LedgerEntry[]>;
  mockTopup(packId: string, idempotencyKey: string): Promise<TopupResult>;
  unlockChapter(input: {
    chapter_id?: string;
    work_id?: string;
    expected_price: number;
  }): Promise<UnlockResult>;
  getMangaPageUrl(chapterId: string, pageNumber: number): Promise<MangaPageUrl>;
  listBookshelf(): Promise<BookshelfItem[]>;
  toggleBookshelf(workId: string): Promise<boolean>;
  inBookshelf(workId: string): Promise<boolean>;
  listHistory(): Promise<ReadingProgress[]>;
  saveProgress(workId: string, chapterId: string, position: number): Promise<void>;
  isChapterUnlocked(chapterId: string): Promise<boolean>;
}
