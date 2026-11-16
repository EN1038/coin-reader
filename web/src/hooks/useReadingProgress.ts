import { useEffect, useRef } from 'react';
import { api } from '../lib/supabase';

/**
 * บันทึกประวัติการอ่านอัตโนมัติเมื่อล็อกอินแล้ว
 * — เขียนครั้งแรกตอนเปิดตอน แล้วอัปเดตตำแหน่งเลื่อนแบบ debounce
 */
export function useReadingProgress(
  workId: string | undefined,
  chapterId: string | undefined,
  enabled: boolean,
) {
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || !workId || !chapterId) return;
    let cancelled = false;
    lastSent.current = 0;

    void api.saveProgress(workId, chapterId, 0.05).then(() => {
      lastSent.current = 0.05;
    });

    let timer: ReturnType<typeof setTimeout> | undefined;

    function send(pos: number) {
      if (cancelled || !workId || !chapterId) return;
      const clamped = Math.min(0.99, Math.max(0.05, pos));
      if (Math.abs(clamped - lastSent.current) < 0.04) return;
      lastSent.current = clamped;
      void api.saveProgress(workId, chapterId, clamped);
    }

    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pos = max <= 0 ? 0.05 : window.scrollY / max;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => send(pos), 600);
    }

    function onHide() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pos = max <= 0 ? lastSent.current : window.scrollY / max;
      send(pos);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      onHide();
    };
  }, [workId, chapterId, enabled]);
}
