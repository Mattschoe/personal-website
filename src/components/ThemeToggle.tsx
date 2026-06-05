import { useTheme } from './theme-context';

// Two presentations of the same toggle, matching the reference:
//  - "icon"  → header .icon-btn with sun/moon svgs (svg paths copied verbatim
//              from design-reference/index.html)
//  - "label" → footer .arrow-link text button ("Theme: Daylight ↻")

export function ThemeToggle({ variant }: { variant: 'icon' | 'label' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'label') {
    return (
      <button
        className="arrow-link"
        data-theme-toggle
        aria-pressed={isDark}
        onClick={toggle}
        style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
      >
        Theme: <span data-theme-label>{isDark ? 'Twilight' : 'Daylight'}</span>{' '}
        <span className="ar">&#8635;</span>
      </button>
    );
  }

  return (
    <button
      className="icon-btn"
      data-theme-toggle
      aria-label="Toggle Daylight / Twilight theme"
      aria-pressed={isDark}
      title="Toggle theme"
      onClick={toggle}
    >
      <svg
        className="i-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        style={{ display: isDark ? 'none' : undefined }}
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8" />
      </svg>
      <svg
        className="i-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: isDark ? undefined : 'none' }}
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z" />
      </svg>
    </button>
  );
}
