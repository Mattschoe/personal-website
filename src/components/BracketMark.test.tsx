import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BracketMark } from './BracketMark';

describe('BracketMark', () => {
  it('renders a decorative svg with three paths', () => {
    const { container } = render(<BracketMark />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg?.querySelectorAll('path')).toHaveLength(3);
  });

  it('applies the size prop as the svg height', () => {
    const { container } = render(<BracketMark size="2.5rem" />);
    expect(container.querySelector('svg')).toHaveStyle({ height: '2.5rem' });
  });

  it('merges an extra className', () => {
    const { container } = render(<BracketMark className="extra" />);
    expect(container.querySelector('svg')?.classList.contains('extra')).toBe(
      true,
    );
  });
});
