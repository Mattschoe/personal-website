/* Theme: Daylight (default) ↔ Twilight (dark). Persisted in localStorage,
   shared across every page. Set BEFORE paint via the inline snippet in <head>. */
(function () {
  const KEY = 'matt-theme';
  const root = document.documentElement;

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }

  // Read saved (inline head snippet already applied it to avoid flash, but re-sync)
  let current = localStorage.getItem(KEY) || 'light';
  apply(current);

  function wireToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const sync = () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-pressed', String(isDark));
        const sun = btn.querySelector('.i-sun');
        const moon = btn.querySelector('.i-moon');
        if (sun && moon) { sun.style.display = isDark ? 'none' : ''; moon.style.display = isDark ? '' : 'none'; }
        const label = btn.querySelector('[data-theme-label]');
        if (label) label.textContent = isDark ? 'Twilight' : 'Daylight';
      };
      btn.addEventListener('click', () => {
        current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem(KEY, current);
        apply(current);
        sync();
      });
      sync();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggle);
  } else { wireToggle(); }
})();
