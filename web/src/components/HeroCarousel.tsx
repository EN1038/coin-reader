import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HeroBanner } from '../lib/types';
import { useSiteAsset } from '../context/SiteAssetsContext';

const FADE_MS = 360;

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const heroFallback = useSiteAsset('hero_fallback');
  const fallback = useMemo<HeroBanner>(() => ({
    id: 'fallback-hero',
    title: 'Stock Manga',
    alt: 'อ่านมังงะออนไลน์ อัปเดตตอนใหม่ทุกวัน — คลังมังงะคุณภาพ หลากหลายแนว อ่านได้ฟรี สะดวก ทุกอุปกรณ์',
    image_url: heroFallback,
    href: '/discover',
    sort_order: 1,
    active: true,
  }), [heroFallback]);

  const slides = banners.length ? banners : [fallback];
  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, slides.length - 1)] ?? fallback;

  const [active, setActive] = useState(current);
  const [outgoing, setOutgoing] = useState<HeroBanner | null>(null);
  const [fadeIn, setFadeIn] = useState(true);
  const activeIdRef = useRef(current.id);

  useEffect(() => {
    setIndex(0);
  }, [slides.length, slides[0]?.id]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (current.id === activeIdRef.current) {
      setActive(current);
      return undefined;
    }
    activeIdRef.current = current.id;
    setOutgoing(active);
    setActive(current);
    setFadeIn(false);
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setFadeIn(true));
    });
    const clear = window.setTimeout(() => setOutgoing(null), FADE_MS);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(clear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only swap on slide identity
  }, [current]);

  return (
    <section className="cm-hero" aria-label="แบนเนอร์โปรโมท">
      <div className="cm-hero-carousel">
        <Link
          to={active.href || '/discover'}
          className="cm-hero-banner"
          aria-label={active.title || 'เริ่มอ่านเลย'}
        >
          <span className="cm-hero-slides">
            {outgoing && (
              <img
                className="cm-hero-slide is-out"
                src={outgoing.image_url || heroFallback}
                alt=""
                width={1600}
                height={520}
                decoding="async"
                aria-hidden
              />
            )}
            <img
              key={active.id}
              className={`cm-hero-slide is-in${fadeIn ? ' on' : ''}`}
              src={active.image_url || heroFallback}
              alt={active.alt || active.title || 'แบนเนอร์'}
              width={1600}
              height={520}
              decoding="async"
              fetchPriority="high"
            />
          </span>
        </Link>
        {slides.length > 1 && (
          <div className="cm-hero-dots" role="tablist" aria-label="สไลด์แบนเนอร์">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`cm-hero-dot${i === index ? ' on' : ''}`}
                onClick={() => setIndex(i)}
              >
                <span className="sr-only">{s.title || `สไลด์ ${i + 1}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
