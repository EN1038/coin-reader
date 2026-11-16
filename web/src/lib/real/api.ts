import { ApiError } from '../types';
import type { CoinReaderApi } from '../api';
import { getSupabase } from '../supabase';
import type {
  Work, Chapter, ChapterContent, CoinPack, SessionUser,
  UnlockResult, TopupResult, MangaPageUrl, BookshelfItem, ReadingProgress, LedgerEntry, Category,
  HeroBanner,
} from '../types';
import { seedCategories, seedWorks, seedChapters } from '../mock/seed';
import { BRAND_HERO, COVER_DEFAULT } from '../brand';
import type { ListWorksParams } from '../api';

const FALLBACK_BANNERS: HeroBanner[] = [{
  id: 'fallback-hero',
  title: 'Stock Manga',
  alt: 'อ่านมังงะออนไลน์ อัปเดตตอนใหม่ทุกวัน',
  image_url: BRAND_HERO,
  href: '/discover',
  sort_order: 1,
  active: true,
}];

function withCover(work: Work): Work {
  return { ...work, cover_url: work.cover_url?.trim() || COVER_DEFAULT };
}

/** Map Supabase works row → frontend Work (mock-compatible) */
function mapWork(row: Record<string, unknown>): Work {
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const dbRating = String(row.rating ?? 'general');
  const rating = dbRating === '18+' || tags.includes('18+') ? '18+' : 'ทั่วไป';
  const completed = Boolean(row.completed) || row.status === 'completed';
  return withCover({
    id: String(row.id),
    slug: String(row.slug ?? ''),
    title: String(row.title ?? ''),
    synopsis: String(row.synopsis ?? ''),
    kind: (row.kind === 'manga' ? 'manga' : 'novel'),
    category: String(row.category ?? ''),
    tags,
    rating,
    status: completed ? 'completed' : 'published',
    cover_tone: (['default', 'warm', 'teal', 'rose', 'blue'].includes(String(row.cover_tone))
      ? String(row.cover_tone)
      : 'default') as Work['cover_tone'],
    cover_url: (row.cover_url as string | null | undefined) ?? (row.cover_path as string | null | undefined),
    author_id: String(row.author_id ?? ''),
    author_name: String(row.author_name ?? ''),
    price_full_work: row.price_full_work == null ? null : Number(row.price_full_work),
    chapter_count: Number(row.chapter_count ?? 0),
    free_episode_count: Number(row.free_episode_count ?? 0),
    views: Number(row.views ?? 0),
    bookmark_count: Number(row.bookmark_count ?? 0),
    score: Number(row.score ?? 0),
    rating_count: Number(row.rating_count ?? 0),
    rank_daily: Number(row.rank_daily ?? 0),
    rank_weekly: Number(row.rank_weekly ?? 0),
    rank_monthly: Number(row.rank_monthly ?? 0),
    latest_at: String(row.latest_at ?? row.published_at ?? new Date().toISOString()),
    is_example_data: true,
    featured: Boolean(row.featured),
    popular: Boolean(row.popular),
    is_new: Boolean(row.is_new),
  });
}

function mapChapter(row: Record<string, unknown>): Chapter {
  return {
    id: String(row.id),
    work_id: String(row.work_id),
    number: Number(row.number),
    title: String(row.title ?? ''),
    pricing: row.pricing === 'coin' ? 'coin' : 'free',
    coin_price: Number(row.coin_price ?? 0),
    follow_free: Boolean(row.follow_to_read ?? row.follow_free),
    published_at: String(row.publish_at ?? row.published_at ?? new Date().toISOString()),
    status: 'published',
    is_example_data: true,
  };
}

function filterSeedWorks(params?: ListWorksParams): Work[] {
  let list = seedWorks.map(withCover);
  if (params?.kind) list = list.filter((w) => w.kind === params.kind);
  if (params?.category && params.category !== 'ทั้งหมด') list = list.filter((w) => w.category === params.category);
  if (params?.q) {
    const q = params.q.toLowerCase();
    list = list.filter((w) => w.title.toLowerCase().includes(q) || w.author_name.toLowerCase().includes(q));
  }
  if (params?.status) list = list.filter((w) => w.status === params.status);
  if (params?.featured) list = list.filter((w) => w.featured);
  if (params?.popular) list = list.filter((w) => w.popular);
  if (params?.isNew) list = list.filter((w) => w.is_new);
  switch (params?.sort) {
    case 'views':
    case 'daily':
      return list.sort((a, b) => b.rank_daily - a.rank_daily);
    case 'weekly':
      return list.sort((a, b) => b.rank_weekly - a.rank_weekly);
    case 'monthly':
      return list.sort((a, b) => b.rank_monthly - a.rank_monthly);
    case 'rating':
      return list.sort((a, b) => b.score - a.score);
    case 'new':
      return list.sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at));
    case 'updated':
    default:
      return list.sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at));
  }
}

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
  const { data: profile } = await client
    .from('profiles')
    .select('display_name,watermark_id,avatar_url')
    .eq('id', data.user.id)
    .maybeSingle();
  const metaName = (data.user.user_metadata as { display_name?: string } | undefined)?.display_name;
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    display_name: (profile?.display_name || metaName || data.user.email || 'ผู้ใช้') as string,
    watermark_id: profile?.watermark_id ?? data.user.id.slice(0, 8),
    avatar_url: (profile?.avatar_url as string | null | undefined) ?? null,
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
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    if (data.user) {
      const name = displayName.trim().slice(0, 80);
      if (name) {
        await sb().from('profiles').update({ display_name: name }).eq('id', data.user.id);
      }
    }
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED', 'สมัครแล้ว แต่ยังไม่มีเซสชัน — ตรวจยืนยันอีเมล');
    return u;
  },

  async logout() {
    await sb().auth.signOut();
  },

  async updateProfile(input) {
    const client = sb();
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData.session;
    if (!session?.user) throw new ApiError(401, 'UNAUTHORIZED');
    const userId = session.user.id;

    const name = input.display_name.trim();
    if (!name || name.length > 80) {
      throw new ApiError(400, 'VALIDATION', 'ชื่อต้องมีความยาว 1–80 ตัวอักษร');
    }

    const patch: { display_name: string; avatar_url?: string | null } = { display_name: name };
    const path = `${userId}/avatar.jpg`;

    if (input.clear_avatar) {
      patch.avatar_url = null;
      await client.storage.from('avatars').remove([path]);
    } else if (input.avatar_blob) {
      // Prefer replace: remove then insert (avoids upsert RLS edge cases)
      await client.storage.from('avatars').remove([path]);
      const { error: upErr } = await client.storage.from('avatars').upload(path, input.avatar_blob, {
        upsert: false,
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });
      if (upErr) {
        // Fallback: keep photo inline if storage policy still blocks
        try {
          const { blobToDataUrl } = await import('../avatar');
          patch.avatar_url = await blobToDataUrl(input.avatar_blob);
        } catch {
          throw new ApiError(400, 'VALIDATION', upErr.message || 'อัปโหลดรูปไม่สำเร็จ');
        }
      } else {
        const { data: pub } = client.storage.from('avatars').getPublicUrl(path);
        patch.avatar_url = `${pub.publicUrl}?v=${Date.now()}`;
      }
    }

    const { error } = await client.from('profiles').update(patch).eq('id', userId);
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    const u = await mapUser();
    if (!u) throw new ApiError(401, 'UNAUTHORIZED');
    return u;
  },

  async listWorks(params) {
    try {
      let q = sb().from('works').select('*').eq('status', 'published');
      if (params?.kind) q = q.eq('kind', params.kind);
      if (params?.category && params.category !== 'ทั้งหมด') q = q.eq('category', params.category);
      if (params?.q) q = q.ilike('title', `%${params.q}%`);
      if (params?.featured) q = q.eq('featured', true);
      if (params?.popular) q = q.eq('popular', true);
      if (params?.isNew) q = q.eq('is_new', true);
      const { data, error } = await q;
      if (error || !data?.length) return filterSeedWorks(params);
      let list = (data as Record<string, unknown>[]).map(mapWork);
      if (params?.status) list = list.filter((w) => w.status === params.status);
      switch (params?.sort) {
        case 'views':
        case 'daily':
          list = list.sort((a, b) => b.rank_daily - a.rank_daily);
          break;
        case 'weekly':
          list = list.sort((a, b) => b.rank_weekly - a.rank_weekly);
          break;
        case 'monthly':
          list = list.sort((a, b) => b.rank_monthly - a.rank_monthly);
          break;
        case 'rating':
          list = list.sort((a, b) => b.score - a.score);
          break;
        case 'new':
          list = list.sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at));
          break;
        case 'updated':
        default:
          list = list.sort((a, b) => +new Date(b.latest_at) - +new Date(a.latest_at));
      }
      return list;
    } catch {
      return filterSeedWorks(params);
    }
  },

  async getWorkBySlug(slug) {
    try {
      const { data, error } = await sb().from('works').select('*').or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
      if (error) throw new ApiError(500, 'UNKNOWN', error.message);
      if (data) return mapWork(data as Record<string, unknown>);
    } catch {
      /* fall through to seed */
    }
    const seeded = seedWorks.find((w) => w.slug === slug || w.id === slug);
    if (!seeded) throw new ApiError(404, 'NOT_FOUND');
    return withCover(seeded);
  },

  async getWork(id) {
    try {
      const { data, error } = await sb().from('works').select('*').eq('id', id).maybeSingle();
      if (error) throw new ApiError(500, 'UNKNOWN', error.message);
      if (data) return mapWork(data as Record<string, unknown>);
    } catch {
      /* fall through to seed */
    }
    const seeded = seedWorks.find((w) => w.id === id);
    if (!seeded) throw new ApiError(404, 'NOT_FOUND');
    return withCover(seeded);
  },

  async listChapters(workId) {
    try {
      const { data, error } = await sb()
        .from('chapters')
        .select('*')
        .eq('work_id', workId)
        .eq('status', 'published')
        .order('number');
      if (error) throw new ApiError(500, 'UNKNOWN', error.message);
      if (data?.length) return (data as Record<string, unknown>[]).map(mapChapter);
    } catch {
      /* fall through to seed */
    }
    return seedChapters.filter((c) => c.work_id === workId);
  },

  async getChapter(chapterId) {
    const { data, error } = await sb().from('chapters').select('*').eq('id', chapterId).maybeSingle();
    if (error) throw new ApiError(500, 'UNKNOWN', error.message);
    if (!data) throw new ApiError(404, 'NOT_FOUND');
    return mapChapter(data as Record<string, unknown>);
  },

  async getChapterContent(chapterId) {
    const allowed = await this.isChapterUnlocked(chapterId);
    if (!allowed) throw new ApiError(403, 'UNAUTHORIZED', 'ยังไม่ได้ปลดล็อกตอนนี้');
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
    return { gold: balance, diamond: 0, balance };
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
    const allowed = await this.isChapterUnlocked(chapterId);
    if (!allowed) throw new ApiError(403, 'UNAUTHORIZED', 'ยังไม่ได้ปลดล็อกตอนนี้');
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
    let work: Work | null = null;
    try {
      work = await this.getWork(chapter.work_id);
    } catch {
      work = null;
    }
    if (chapter.pricing === 'free') return true;
    if (work && chapter.number <= (work.free_episode_count ?? 0)) return true;

    const u = await mapUser();
    if (!u) return false;

    const { data: unlock } = await sb()
      .from('unlocks')
      .select('chapter_id')
      .eq('user_id', u.id)
      .eq('chapter_id', chapterId)
      .maybeSingle();
    if (unlock) return true;

    const { data: purchase } = await sb()
      .from('work_purchases')
      .select('work_id')
      .eq('user_id', u.id)
      .eq('work_id', chapter.work_id)
      .maybeSingle();
    if (purchase) return true;

    if (chapter.follow_free && work) {
      const following = await this.inBookshelf(work.id);
      if (following) return true;
    }
    return false;
  },

  async listRecentUpdates(limit = 8) {
    const works = (await this.listWorks({ sort: 'updated' })).slice(0, limit);
    const out = [];
    for (const work of works) {
      const chapters = await this.listChapters(work.id);
      const episodes = [...chapters]
        .sort((a, b) => b.number - a.number)
        .slice(0, 2)
        .map((c) => ({
          id: c.id,
          number: c.number,
          title: c.title,
          published_at: c.published_at,
        }));
      out.push({ work, episodes });
    }
    return out;
  },
  async checkInCalendar() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async claimCheckIn() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async ticketBalance() { return 0; },
  async unlockWithTicket() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async referralInfo() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async listComments() { return []; },
  async addComment() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async listWorkComments() { return []; },
  async addWorkComment() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async toggleCommentLike() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async rateWork() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },
  async myRating() { return null; },
  async tipWriter() { throw new ApiError(501, 'MOCK_DISABLED', 'โหมด mock เท่านั้น'); },

  async listCategories(activeOnly = true) {
    try {
      let q = sb().from('categories').select('id,name,slug,icon_key,sort_order,active').order('sort_order');
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error || !data?.length) {
        return seedCategories.filter((c) => (activeOnly ? c.active : true));
      }
      return data as Category[];
    } catch {
      return seedCategories.filter((c) => (activeOnly ? c.active : true));
    }
  },

  async upsertCategory() {
    throw new ApiError(501, 'MOCK_DISABLED', 'จัดการหมวดหมู่ผ่าน admin mock ก่อน หรือใช้ SQL บน Supabase');
  },

  async deleteCategory() {
    throw new ApiError(501, 'MOCK_DISABLED', 'จัดการหมวดหมู่ผ่าน admin mock ก่อน หรือใช้ SQL บน Supabase');
  },

  async listBanners(activeOnly = true) {
    try {
      let q = sb().from('hero_banners').select('id,title,alt,image_url,href,sort_order,active').order('sort_order');
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error || !data?.length) return FALLBACK_BANNERS;
      return data.map((row) => ({
        id: String(row.id),
        title: String(row.title ?? ''),
        alt: String(row.alt ?? ''),
        image_url: String(row.image_url ?? ''),
        href: String(row.href ?? '/discover'),
        sort_order: Number(row.sort_order ?? 0),
        active: Boolean(row.active),
      }));
    } catch {
      return FALLBACK_BANNERS;
    }
  },

  async upsertBanner(input) {
    const client = sb();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new ApiError(401, 'UNAUTHORIZED');
    const payload = {
      title: input.title.trim() || 'แบนเนอร์',
      alt: input.alt.trim() || input.title.trim() || 'แบนเนอร์',
      image_url: input.image_url.trim(),
      href: input.href.trim() || '/discover',
      sort_order: input.sort_order,
      active: input.active,
    };
    if (!payload.image_url) throw new ApiError(400, 'VALIDATION', 'กรุณาใส่รูปแบนเนอร์');

    if (input.id && input.id !== 'fallback-hero') {
      const { data, error } = await client.from('hero_banners').update(payload).eq('id', input.id).select('*').maybeSingle();
      if (error) throw new ApiError(400, 'VALIDATION', error.message);
      if (!data) throw new ApiError(404, 'NOT_FOUND');
      return {
        id: String(data.id),
        title: String(data.title ?? ''),
        alt: String(data.alt ?? ''),
        image_url: String(data.image_url ?? ''),
        href: String(data.href ?? '/discover'),
        sort_order: Number(data.sort_order ?? 0),
        active: Boolean(data.active),
      };
    }

    const { data, error } = await client.from('hero_banners').insert(payload).select('*').single();
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    return {
      id: String(data.id),
      title: String(data.title ?? ''),
      alt: String(data.alt ?? ''),
      image_url: String(data.image_url ?? ''),
      href: String(data.href ?? '/discover'),
      sort_order: Number(data.sort_order ?? 0),
      active: Boolean(data.active),
    };
  },

  async deleteBanner(id) {
    if (id === 'fallback-hero') throw new ApiError(400, 'VALIDATION', 'ลบแบนเนอร์เริ่มต้นไม่ได้');
    const { error } = await sb().from('hero_banners').delete().eq('id', id);
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
  },

  async getSiteAssets() {
    const { mergeSiteAssets, SITE_ASSET_DEFAULTS } = await import('../siteAssets');
    try {
      const { data, error } = await sb().from('site_assets').select('key,image_url');
      if (error || !data?.length) return { ...SITE_ASSET_DEFAULTS };
      const partial: Record<string, string> = {};
      for (const row of data) {
        if (row.key && row.image_url) partial[String(row.key)] = String(row.image_url);
      }
      return mergeSiteAssets(partial);
    } catch {
      return { ...SITE_ASSET_DEFAULTS };
    }
  },

  async updateSiteAsset(key, imageUrl) {
    const client = sb();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new ApiError(401, 'UNAUTHORIZED');
    const url = imageUrl.trim();
    if (!url) throw new ApiError(400, 'VALIDATION', 'รูปไม่ถูกต้อง');
    const { error } = await client.from('site_assets').upsert({
      key,
      image_url: url,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    return this.getSiteAssets();
  },

  async resetSiteAsset(key) {
    const client = sb();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new ApiError(401, 'UNAUTHORIZED');
    const { SITE_ASSET_DEFAULTS } = await import('../siteAssets');
    const fallback = SITE_ASSET_DEFAULTS[key];
    if (!fallback) throw new ApiError(400, 'VALIDATION', 'คีย์ไม่ถูกต้อง');
    const { error } = await client.from('site_assets').upsert({
      key,
      image_url: fallback,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new ApiError(400, 'VALIDATION', error.message);
    return this.getSiteAssets();
  },
};
