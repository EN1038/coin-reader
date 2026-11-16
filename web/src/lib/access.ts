import type { Chapter, Work } from './types';

export type EpisodeState = 'free' | 'unlocked' | 'follow' | 'locked';

export function isFreeEpisode(work: Work, chapter: Chapter): boolean {
  return chapter.pricing === 'free' || chapter.number <= work.free_episode_count;
}

export function episodeState(
  work: Work,
  chapter: Chapter,
  opts: { unlocked: boolean; following: boolean },
): EpisodeState {
  if (isFreeEpisode(work, chapter)) return 'free';
  if (opts.unlocked) return 'unlocked';
  if (chapter.follow_free && opts.following) return 'unlocked';
  if (chapter.follow_free) return 'follow';
  return 'locked';
}

export function canReadEpisode(
  work: Work,
  chapter: Chapter,
  opts: { unlocked: boolean; following: boolean },
): boolean {
  const state = episodeState(work, chapter, opts);
  return state === 'free' || state === 'unlocked';
}

/** Path ไปหน้าอ่าน — ใช้จากประวัติ / continue / reader nav */
export function readPathFor(work: Pick<Work, 'id' | 'kind'>, chapterId: string): string {
  return work.kind === 'manga'
    ? `/read/manga/${work.id}/${chapterId}`
    : `/read/novel/${work.id}/${chapterId}`;
}

export function seriesPathFor(work: Pick<Work, 'slug'>): string {
  return `/works/${work.slug}`;
}
