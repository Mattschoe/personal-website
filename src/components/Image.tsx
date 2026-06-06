import styles from './Image.module.css';

// The placeholder palette tones (SPEC §4 / global.css `.ph[data-tone]`).
export type Tone = 'sage' | 'beeswax' | 'grenadine' | 'latte';

export interface ImageProps {
  /** Absolute `/images/...` path (Phase 8 stores images under `public/`).
   *  When absent, the toned `.ph` placeholder renders instead. */
  src?: string;
  /** Alt text — required in spirit when `src` is set; pass `''` for purely
   *  decorative images (e.g. portraits) so screen readers skip them. */
  alt?: string;
  /** Placeholder background tone (also tints behind a transparent image). */
  tone?: Tone;
  /** Placeholder caption shown bottom-left via `.ph::after` (e.g. "Lead image · 16:8").
   *  Omitted when an image is present. */
  label?: string;
  /** Optional centered placeholder glyph (e.g. "M", "✶"). Placeholder-only. */
  glyph?: string;
  /** Passthrough class for the call-site sizing/shape wrapper (aspect ratio,
   *  circular crop, etc.) — these target `:global(.ph)` so they keep working. */
  className?: string;
}

/**
 * Renders a real `<img>` when `src` is provided, gracefully falling back to the
 * existing toned `.ph` placeholder when it isn't — so a page never looks broken
 * and adding a photo later is just a front-matter `hero:` edit (CLAUDE.md Rule 4).
 *
 * The root is always the `.ph` element, so every existing CSS-Module override
 * that targets `:global(.ph)` (aspect ratio, `border-radius:50%`, min-heights)
 * applies unchanged. The image is absolutely positioned to fill that box
 * (`object-fit: cover`), so the box's size — and thus layout — is identical
 * whether or not an image is present (no layout shift).
 */
export function Image({ src, alt = '', tone, label, glyph, className }: ImageProps) {
  const cls = ['ph', src ? styles.filled : '', className].filter(Boolean).join(' ');

  if (src) {
    // No `data-ph` (so the caption is empty); the image covers the box.
    return (
      <div className={cls} data-tone={tone}>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={cls} data-tone={tone} data-ph={label}>
      {glyph && <span className="ph-glyph">{glyph}</span>}
    </div>
  );
}
