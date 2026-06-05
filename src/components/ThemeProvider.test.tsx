import { render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './theme-context';

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} data-testid="probe">
      {theme}
    </button>
  );
}

describe('ThemeProvider / useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('syncs initial state from a pre-set data-theme on <html>', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('dark');
  });

  it('toggle flips data-theme on <html> and persists to localStorage', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const probe = screen.getByTestId('probe');
    expect(probe).toHaveTextContent('light');

    act(() => probe.click());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('matt-theme')).toBe('dark');
    expect(probe).toHaveTextContent('dark');

    act(() => probe.click());
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('matt-theme')).toBe('light');
    expect(probe).toHaveTextContent('light');
  });

  it('throws when used outside a provider', () => {
    const Bare = () => {
      useTheme();
      return null;
    };
    expect(() => render(<Bare />)).toThrow(/ThemeProvider/);
  });
});
