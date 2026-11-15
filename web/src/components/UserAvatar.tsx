import { profileInitials } from '../lib/avatar';

export function UserAvatar({
  name,
  src,
  className = '',
  size,
}: {
  name: string;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  const style = size ? { width: size, height: size, fontSize: Math.round(size * 0.36) } : undefined;
  if (src) {
    return (
      <img
        className={`user-av ${className}`.trim()}
        src={src}
        alt=""
        style={style}
        decoding="async"
      />
    );
  }
  return (
    <div className={`user-av user-av--fallback ${className}`.trim()} style={style} aria-hidden>
      {profileInitials(name)}
    </div>
  );
}
