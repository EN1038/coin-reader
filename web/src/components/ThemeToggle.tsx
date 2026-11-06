import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        className="icon-btn"
        aria-label={theme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        title={theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    );
  }

  return (
    <div className="card row-between" role="group" aria-label="ธีม">
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>ธีม</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {theme === 'dark' ? 'โหมดมืด · Twilight' : 'โหมดสว่าง'}
        </div>
      </div>
      <div className="theme-seg">
        <button
          type="button"
          className={theme === 'light' ? 'on' : ''}
          aria-pressed={theme === 'light'}
          onClick={() => setTheme('light')}
        >
          สว่าง
        </button>
        <button
          type="button"
          className={theme === 'dark' ? 'on' : ''}
          aria-pressed={theme === 'dark'}
          onClick={() => setTheme('dark')}
        >
          มืด
        </button>
      </div>
    </div>
  );
}
