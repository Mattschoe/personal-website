import { useEffect, useRef } from 'react';
import { useTheme } from './theme-context';
import { createFlowField, FLOW_COLORS } from './flowField';
import styles from './HeroCircle.module.css';

// Fallback background if --bg can't be read (matches the light token).
const BG_FALLBACK = '#F6EEDF';

function prefersReducedMotion(): boolean {
  // Guard for SSR / jsdom where matchMedia may be absent.
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The hero's circular graphic: a live Flow Field of palette particles rendered
 * to a single <canvas>. Purely decorative (it replaces the old portrait
 * placeholder), so the wrapper is aria-hidden. The effect is recreated on theme
 * toggle so it re-reads the theme-dependent --bg.
 */
export function HeroCircle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bg =
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() ||
      BG_FALLBACK;

    const inst = createFlowField(canvas, {
      colors: FLOW_COLORS,
      bg,
      animate: !prefersReducedMotion(),
    });
    return inst.destroy;
    // Re-init on theme change so the watery trails repaint over the new --bg.
  }, [theme]);

  return (
    <div className={styles.circle} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
