import { describe, it, expect } from 'vitest';
import { webpTargetFor } from './optimize-images.mjs';

// webpTargetFor encodes the whole convert/skip decision: raster sources get a
// sibling `.webp`; `.webp` (and anything else) is left untouched (returns null,
// so the pipeline never reads or re-encodes it).
describe('webpTargetFor', () => {
  it('maps a .jpg to a sibling .webp', () => {
    expect(webpTargetFor('/public/images/recipes/curry_chickpeas.jpg')).toBe(
      '/public/images/recipes/curry_chickpeas.webp',
    );
  });

  it('maps .jpeg and .png too', () => {
    expect(webpTargetFor('/img/a.jpeg')).toBe('/img/a.webp');
    expect(webpTargetFor('/img/b.png')).toBe('/img/b.webp');
  });

  it('is case-insensitive on the extension', () => {
    expect(webpTargetFor('/img/PHOTO.JPG')).toBe('/img/PHOTO.webp');
    expect(webpTargetFor('/img/Shot.PNG')).toBe('/img/Shot.webp');
  });

  it('returns null for a .webp input (never re-encoded)', () => {
    expect(webpTargetFor('/img/hero.webp')).toBeNull();
  });

  it('returns null for non-raster files', () => {
    expect(webpTargetFor('/img/icon.svg')).toBeNull();
    expect(webpTargetFor('/img/.gitkeep')).toBeNull();
  });

  it('only replaces the final extension', () => {
    expect(webpTargetFor('/img/my.photo.v2.jpg')).toBe('/img/my.photo.v2.webp');
  });
});
