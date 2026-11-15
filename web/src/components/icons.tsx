import type { CategoryIconKey } from '../lib/types';

type IconProps = {
  size?: number;
  className?: string;
};

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function IconSearch({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function IconBack({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M15 6 9 12l6 6" />
    </svg>
  );
}

export function IconChevronRight({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconChevronLeft({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function IconChevronDown({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Filled triangle caret — settings / FAQ list rows */
export function IconCaretRight({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M9 5.5v13l10-6.5L9 5.5z" />
    </svg>
  );
}

export function IconArrowRight({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function IconTrophy({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 0 0 5.5 10.5H8M16 5.5h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M12 13.5v2.5M9.5 20h5M10.5 16h3a1 1 0 0 1 1 1v1.5h-5V17a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function IconCrown({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 16.5 6.2 8.5 10 12l2-6.5L14 12l3.8-3.5L20 16.5H4z" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function IconUser({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.3-3.1 3.6-4.6 6.5-4.6s5.2 1.5 6.5 4.6" />
    </svg>
  );
}

export function IconHome({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function IconRank({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

export function IconShelf({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 5h14v14H5zM5 12h14M12 5v14" />
    </svg>
  );
}

export function IconBell({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5S6.5 14.5 6.5 9.5" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconStar({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="m12 3.4 2.5 5.1 5.6.8-4 3.9.9 5.6L12 16.2 6.9 19l.9-5.6-4-3.9 5.6-.8z" />
    </svg>
  );
}

export function IconEye({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function IconCoin({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5v9M9.2 9.4c.7-1 1.9-1.5 2.8-1.5 1.6 0 2.8.9 2.8 2.2s-1.2 2.2-2.8 2.2H11c-1.6 0-2.8.9-2.8 2.2 0 1.3 1.3 2.2 3 2.2.9 0 2-.4 2.7-1.3" />
    </svg>
  );
}

export function IconDiamond({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 9.5 7.5 4.5h9l4 5-7.5 10.5L3.5 9.5z" />
      <path d="M3.5 9.5h17M8 4.5 10.5 9.5 12 4.5 13.5 9.5 16 4.5" />
    </svg>
  );
}

export function IconSun({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12h2.2M19 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}

export function IconMoon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 7.6 7.6 0 1 0 19.5 13.2z" />
    </svg>
  );
}

export function IconCheck({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function IconX({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

export function IconCalendar({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
    </svg>
  );
}

export function IconGift({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 11h16v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5V11z" />
      <path d="M3.5 7.5h17v3.5h-17zM12 7.5v14.5M12 7.5c0-2.2-1.3-3.5-2.8-3.5S6.5 5.3 7.8 7.2C8.6 8.3 10 8.8 12 7.5zM12 7.5c0-2.2 1.3-3.5 2.8-3.5S17.5 5.3 16.2 7.2C15.4 8.3 14 8.8 12 7.5z" />
    </svg>
  );
}

export function IconBook({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21" />
      <path d="M5 5.5v15.5" />
    </svg>
  );
}

export function IconFolder({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3.5 8.5V7a2 2 0 0 1 2-2h4.2l1.8 2H18.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-7.5z" />
    </svg>
  );
}

export function IconThumbsUp({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7.5 11v9.5H5.2A1.7 1.7 0 0 1 3.5 18.8v-6.1c0-.9.7-1.7 1.7-1.7H7.5z" />
      <path d="M7.5 11.5 10.2 4.8c.3-.8 1.2-1.2 2-1 .7.2 1.1.9 1 1.6l-.4 2.6h5.1c1.4 0 2.4 1.3 2.1 2.6l-1.2 6.2c-.3 1.3-1.4 2.2-2.7 2.2H7.5" />
    </svg>
  );
}

export function IconClock({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

export function IconZap({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M13 2.5 5.5 13.5H12l-1 8 7.5-11H12l1-8z" />
    </svg>
  );
}

export function IconSparkles({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5 13.15 8.85 17 10 13.15 11.15 12 15 10.85 11.15 7 10l3.85-1.15z" />
      <path d="M17.5 15.2 18.05 16.85 19.7 17.4 18.05 17.95 17.5 19.6 16.95 17.95 15.3 17.4l1.65-.55z" />
    </svg>
  );
}

export function IconHeart({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 20s-6.5-4.2-8.7-7.8C1.4 9.2 3.2 6 6.4 6c1.8 0 3.1 1 3.9 2.1C11 7 12.3 6 14.1 6c3.2 0 5 3.2 3.1 6.2C18.5 15.8 12 20 12 20z" />
    </svg>
  );
}

export function IconGhost({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 10a6 6 0 0 1 12 0v9l-2.2-1.6L13.5 19 12 17.6 10.5 19 8.2 17.4 6 19z" />
      <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMasks({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 8.5c0-2.5 2.2-4 4.5-4 1.4 0 2.6.5 3.4 1.3.8-.8 2-1.3 3.4-1.3 2.3 0 4.5 1.5 4.5 4 0 4.2-3.2 7-7.9 9.2C8.7 15.5 4.5 12.7 4.5 8.5z" />
      <path d="M9 10.5c.4.7 1 1.1 1.6 1.1M15 10.5c-.4.7-1 1.1-1.6 1.1" />
    </svg>
  );
}

export function IconRocket({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5.5 15.5 4 20l4.5-1.5" />
      <path d="M14.5 4.5c2.8 1 5.2 3.4 6 6.2-2.3 3.5-6.2 6.7-9.4 8.1l-4.9-4.9c1.4-3.2 4.6-7.1 8.3-9.4z" />
      <circle cx="14.2" cy="9.8" r="1.4" />
    </svg>
  );
}

export function CategoryIcon({
  name,
  size = 16,
  className,
}: {
  name: CategoryIconKey | string;
  size?: number;
  className?: string;
}) {
  switch (name) {
    case 'zap':
      return <IconZap size={size} className={className} />;
    case 'sparkles':
      return <IconSparkles size={size} className={className} />;
    case 'heart':
      return <IconHeart size={size} className={className} />;
    case 'ghost':
      return <IconGhost size={size} className={className} />;
    case 'masks':
      return <IconMasks size={size} className={className} />;
    case 'rocket':
      return <IconRocket size={size} className={className} />;
    case 'search':
      return <IconSearch size={size} className={className} />;
    case 'book':
    default:
      return <IconBook size={size} className={className} />;
  }
}
