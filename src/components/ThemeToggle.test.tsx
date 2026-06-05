import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

function renderToggle(variant: 'icon' | 'label') {
  return render(
    <ThemeProvider>
      <ThemeToggle variant={variant} />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('icon variant flips sun/moon and aria-pressed', () => {
    const { container } = renderToggle('icon');
    const btn = screen.getByRole('button', { name: /toggle daylight/i });
    const sun = container.querySelector<HTMLElement>('.i-sun')!;
    const moon = container.querySelector<HTMLElement>('.i-moon')!;

    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(sun.style.display).not.toBe('none');
    expect(moon.style.display).toBe('none');

    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(sun.style.display).toBe('none');
    expect(moon.style.display).not.toBe('none');
  });

  it('label variant flips Daylight/Twilight text', () => {
    renderToggle('label');
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Daylight');
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('Twilight');
  });
});
