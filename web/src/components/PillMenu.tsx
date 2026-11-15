import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconChevronDown } from './icons';

export type PillMenuOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

/** Dropdown แบบเดียวกับ navbar หมวดหมู่ — ใช้ซ้ำได้ทั้ง CMS / ฟอร์ม */
export function PillMenu<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  align = 'left',
}: {
  value: T;
  options: PillMenuOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      className={`pill-menu${open ? ' open' : ''}${className ? ` ${className}` : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={`pill-menu-trigger${open ? ' on' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.icon}
        <span>{current?.label ?? value}</span>
        <IconChevronDown size={14} className="pill-menu-chevron" />
      </button>
      {open && (
        <div
          className={`pill-menu-panel${align === 'right' ? ' right' : ''}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={o.value === value ? 'on' : undefined}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.icon}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
