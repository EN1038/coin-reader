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
