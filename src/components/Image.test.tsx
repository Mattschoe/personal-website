import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Image } from './Image';

describe('Image', () => {
  it('renders a lazy, async <img> when src is provided', () => {
    const { container } = render(
      <Image src="/images/x.jpg" alt="A photo" tone="sage" label="ignored" />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', '/images/x.jpg');
    expect(img).toHaveAttribute('alt', 'A photo');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('keeps the .ph box but drops the caption and glyph when imaged', () => {
    const { container } = render(
      <Image src="/images/x.jpg" alt="A photo" label="Lead image · 16:8" glyph="✶" />,
    );
    const box = container.querySelector('.ph');
    expect(box).not.toBeNull();
    // No placeholder caption attribute and no glyph when a real image renders.
    expect(box).not.toHaveAttribute('data-ph');
    expect(container.querySelector('.ph-glyph')).toBeNull();
  });

  it('passes an empty alt through for decorative images', () => {
    const { container } = render(<Image src="/images/portrait.jpg" alt="" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('falls back to the toned .ph placeholder with caption + glyph when src is absent', () => {
    const { container } = render(
      <Image tone="beeswax" label="Lead image · 16:8" glyph="M" />,
    );
    const box = container.querySelector('.ph');
    expect(box).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(box).toHaveAttribute('data-tone', 'beeswax');
    expect(box).toHaveAttribute('data-ph', 'Lead image · 16:8');
    expect(container.querySelector('.ph-glyph')?.textContent).toBe('M');
  });

  it('omits the glyph element when no glyph is given', () => {
    const { container } = render(<Image tone="sage" label="Project screenshot" />);
    expect(container.querySelector('.ph-glyph')).toBeNull();
  });

  it('forwards a sizing className onto the .ph box', () => {
    const { container } = render(<Image tone="sage" className="shot" />);
    expect(container.querySelector('.ph')).toHaveClass('shot');
  });
});
