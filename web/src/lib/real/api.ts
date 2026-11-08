import { ApiError } from '../types';
import type { CoinReaderApi } from '../api';
import { getSupabase } from '../supabase';
import type {
  Work, Chapter, ChapterContent, CoinPack, SessionUser,
  UnlockResult, TopupResult, MangaPageUrl, BookshelfItem, ReadingProgress, LedgerEntry,
} from '../types';

function sb() {
  const c = getSupabase();
  if (!c) throw new ApiError(500, 'UNKNOWN', 'Supabase client ไม่พร้อม');
  return c;
}

async function edge<T>(name: string, body: unknown, headers?: Record<string, string>): Promise<T> {
  const client = sb();
  const { data: sessionData } = await client.auth.getSession();
  const token = sessionData.session?.access_token;
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${base}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = (json?.error as string) || 'UNKNOWN';
    throw new ApiError(res.status, code as never, undefined, json);
  }
  return json as T;
}

async function mapUser(): Promise<SessionUser | null> {
  const client = sb();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await client.from('profiles').select('display_name,watermark_id').eq('id', data.user.id).maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    display_name: profile?.display_name ?? data.user.email ?? 'ผู้ใช้',
    watermark_id: profile?.watermark_id ?? data.user.id.slice(0, 8),
  };
}

export const realApi: CoinReaderApi = {
  isMock: false,

  async getSession() {
    return mapUser();
  },

  async login(email, password) {
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(401, 'UNAUTHORIZED', error.message);
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED');
    return u;
  },

  async signup(email, password, displayName, _referralCode?: string) {
    const { error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED', 'สมัครแล้ว แต่ยังไม่มีเซสชัน — ตรวจยืนยันอีเมล');
    return u;
  },

  async logout() {
    await sb().auth.signOut();
  },

  async listWorks(params) {
    let q = sb().from('works').select('*').eq('status', 'published');
    if (params?.kind) q = q.eq('kind', params.kind);
    if (params?.category && params.category !== 'ทั้งหมด') q = q.eq('category', params.category);
    if (params?.q) q = q.ilike('title', `%${params.q}%`);
    const { data, error } = await q;
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    return (data ?? []) as Work[];
  },

  async getWorkBySlug(slug) {
    const { data, error } = await sb().from('works').select('*').or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    if (!data) throw new ApiError(404, 'NOT_FOUND');
    return data as Work;
  },

  async getWork(id) {
    const { data, error } = await sb().from('works').select('*').eq('id', id).maybeSingle();
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    if (!data) throw new ApiError(404, 'NOT_FOUND');
    return data as Work;
  },

  async listChapters(workId) {
    const { data, error } = await sb()
      .from('chapters')
      .select('*')
      .eq('work_id', workId)
      .eq('status', 'published')
      .order('number');
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    return (data ?? []) as Chapter[];
  },

  async getChapter(chapterId) {
    const { data, error } = await sb().from('chapters').select('*').eq('id', chapterId).maybeSingle();
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    if (!data) throw new ApiError(404, 'NOT_FOUND');
    return data as Chapter;
  },

  async getChapterContent(chapterId) {
    const { data, error } = await sb().from('chapter_contents').select('*').eq('chapter_id', chapterId).maybeSingle();
    if (error) throw new ApiError(403, 'UNAUTHORIZED', error.message);
    if (!data) throw new ApiError(404, 'NOT_FOUND');
    return data as ChapterContent;
  },

  async listPacks() {
    const { data, error } = await sb().from('coin_packs').select('*').eq('active', true);
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    return (data ?? []) as CoinPack[];
  },

  async myWallet() {
    const { data, error } = await sb().rpc('my_wallet');
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    const balance = typeof data === 'number' ? data : (data as { balance?: number })?.balance ?? 0;
    return { balance };
  },

  async listLedger() {
    const { data, error } = await sb().from('coin_ledger').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    // map loosely — UI shows label/amount; real schema differs
    return ((data ?? []) as Array<Record<string, unknown>>).map((row, i) => ({
      id: String(row.id ?? i),
      kind: 'topup' as const,
      amount: Number(row.amount ?? 0),
      coins: Math.abs(Number(row.amount ?? 0)),
      label: String(row.account ?? 'รายการเหรียญ'),
      created_at: String(row.created_at ?? new Date().toISOString()),
      transaction_id: String(row.transaction_id ?? ''),
    })) as LedgerEntry[];
  },

  async mockTopup(packId, idempotencyKey) {
    return edge<TopupResult>('mock-topup', { pack_id: packId }, { 'Idempotency-Key': idempotencyKey });
  },

  async unlockChapter(input) {
    return edge<UnlockResult>('unlock-chapter', input);
  },

  async getMangaPageUrl(chapterId, pageNumber) {
    return edge<MangaPageUrl>('get-manga-page-url', { chapter_id: chapterId, page_number: pageNumber });
  },

  async listBookshelf() {
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED');
    const { data, error } = await sb().from('bookshelf').select('*').eq('user_id', u.id);
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    return (data ?? []) as BookshelfItem[];
  },

  async toggleBookshelf(workId) {
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED');
    const { data: existing } = await sb().from('bookshelf').select('*').eq('user_id', u.id).eq('work_id', workId).maybeSingle();
    if (existing) {
      await sb().from('bookshelf').delete().eq('user_id', u.id).eq('work_id', workId);
      return false;
    }
    await sb().from('bookshelf').insert({ user_id: u.id, work_id: workId });
    return true;
  },

  async inBookshelf(workId) {
    const u = await mapUser();
    if (!u) return false;
    const { data } = await sb().from('bookshelf').select('work_id').eq('user_id', u.id).eq('work_id', workId).maybeSingle();
    return !!data;
  },

  async listHistory() {
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED');
    const { data, error } = await sb()
      .from('reading_progress')
      .select('*')
      .eq('user_id', u.id)
      .order('updated_at', { ascending: false });
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    return (data ?? []) as ReadingProgress[];
  },

  async saveProgress(workId, chapterId, position) {
    const u = await mapUser();
    if (!u) return;
    await sb().from('reading_progress').upsert({
      user_id: u.id,
      work_id: workId,
      chapter_id: chapterId,
      position,
      updated_at: new Date().toISOString(),
    });
  },

  async isChapterUnlocked(chapterId) {
    const chapter = await this.getChapter(chapterId);
    if (chapter.pricing === 'free') return true;
    const u = await mapUser();
    if (!u) return false;
    const { data } = await sb().from('unlocks').select('chapter_id').eq('user_id', u.id).eq('chapter_id', chapterId).maybeSingle();
    return !!data;
  },

  async listRecentUpdates() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async checkInCalendar() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async claimCheckIn() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async ticketBalance() { return 0; },
  async unlockWithTicket() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async referralInfo() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async listComments() { return []; },
  async addComment() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async toggleCommentLike() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async rateWork() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async myRating() { return null; },
  async tipWriter() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
};
