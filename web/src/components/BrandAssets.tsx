import { PRODUCT_NAME } from '../lib/brand';
import { useSiteAsset } from '../context/SiteAssetsContext';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const LOGO_H: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 72 };
const MASCOT_H: Record<Size, number> = { sm: 48, md: 72, lg: 112, xl: 160 };

export function BrandLogo({
  size = 'md',
  className = '',
  alt = PRODUCT_NAME,
  variant = 'default',
}: {
  size?: Size;
  className?: string;
  alt?: string;
  variant?: 'default' | 'topbar';
}) {
  const logo = useSiteAsset('logo');
  const logoTopbar = useSiteAsset('logo_topbar');
  return (
    <img
      src={variant === 'topbar' ? logoTopbar : logo}
      alt={alt}
      className={`brand-logo brand-logo-${size}${variant === 'topbar' ? ' brand-logo-topbar' : ''}${className ? ` ${className}` : ''}`}
      style={{ height: LOGO_H[size] }}
      decoding="async"
    />
  );
}

export function BrandMascot({
  size = 'md',
  className = '',
  alt = '',
}: {
  size?: Size;
  className?: string;
  alt?: string;
}) {
  const mascot = useSiteAsset('mascot');
  return (
    <img
      src={mascot}
      alt={alt}
      className={`brand-mascot brand-mascot-${size}${className ? ` ${className}` : ''}`}
      style={{ height: MASCOT_H[size] }}
      decoding="async"
      aria-hidden={alt ? undefined : true}
    />
  );
}
