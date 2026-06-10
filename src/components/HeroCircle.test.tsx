import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { HeroCircle } from './HeroCircle';
import { createFlowField, FLOW_COLORS } from './flowField';

function renderCircle() {
  return render(
    <ThemeProvider>
      <HeroCircle />
    </ThemeProvider>,
  );
}

describe('HeroCircle', () => {
  it('renders a <canvas> inside a ThemeProvider without throwing', () => {
    const { container } = renderCircle();
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('mounts and unmounts cleanly (cleanup runs without throwing)', () => {
    const { unmount } = renderCircle();
    expect(() => unmount()).not.toThrow();
  });

  it('marks the decorative wrapper aria-hidden', () => {
    const { container } = renderCircle();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});

describe('createFlowField', () => {
  // jsdom's canvas getContext returns null, so the factory must no-op
  // gracefully and still hand back a callable destroy().
  it('returns an instance with a safe destroy() when there is no 2D context', () => {
    const canvas = document.createElement('canvas');
    const inst = createFlowField(canvas, {
      colors: FLOW_COLORS,
      bg: '#F6EEDF',
      animate: false,
    });
    expect(typeof inst.destroy).toBe('function');
    expect(() => inst.destroy()).not.toThrow();
  });
});
