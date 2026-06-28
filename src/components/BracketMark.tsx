import styles from './BracketMark.module.css';

// The [m] mark: a monospace `m` wrapped in brackets, outlined to vector from
// Space Mono Bold. Inlined (not an <img>) so its colors come from CSS tokens
// and it tracks the site's data-theme toggle — brackets in --accent, m in
// --ink. Decorative: the adjacent "Matt" wordmark already names the brand.
//
// viewBox / path data are the real outlined glyphs (see public/favicon.svg and
// the logo asset set); the box is tight to the mark, ratio ≈ 1.28:1.

interface BracketMarkProps {
  /** CSS height for the mark; width derives from the viewBox ratio. */
  size?: string;
  className?: string;
}

export function BracketMark({ size = '1em', className }: BracketMarkProps) {
  return (
    <svg
      className={`${styles.mark}${className ? ` ${className}` : ''}`}
      viewBox="23.2 -195.2 320.8 250.4"
      style={{ height: size }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        className={styles.brk}
        d="M94 31.200L67.600 31.200Q58.600 31.200 52.900 25.500Q47.200 19.800 47.200 10.800L47.200 10.800L47.200-150.800Q47.200-159.800 52.900-165.500Q58.600-171.200 67.600-171.200L67.600-171.200L94-171.200L94-147.200L77.800-147.200Q72.400-147.200 72.400-141.200L72.400-141.200L72.400 1.200Q72.400 7.200 77.800 7.200L77.800 7.200L94 7.200L94 31.200Z"
      />
      <path
        className={styles.brk}
        d="M299.600 31.200L273.200 31.200L273.200 7.200L289.400 7.200Q294.800 7.200 294.800 1.200L294.800 1.200L294.800-141.200Q294.800-147.200 289.400-147.200L289.400-147.200L273.200-147.200L273.200-171.200L299.600-171.200Q308.600-171.200 314.300-165.500Q320-159.800 320-150.800L320-150.800L320 10.800Q320 19.800 314.300 25.500Q308.600 31.200 299.600 31.200L299.600 31.200Z"
      />
      <path
        className={styles.ink}
        d="M154.800 0L129.600 0L129.600-99.200L154.800-99.200L154.800-89.600L158.400-89.600Q159.600-95 164-98.500Q168.400-102 175.200-102L175.200-102Q181.800-102 186.500-98.500Q191.200-95 192.600-89.600L192.600-89.600L196.200-89.600Q197.800-95 203-98.500Q208.200-102 215.600-102L215.600-102Q225.600-102 231.600-95.300Q237.600-88.600 237.600-76.800L237.600-76.800L237.600 0L212.400 0L212.400-69.600Q212.400-73.800 210.300-75.900Q208.200-78 204.800-78L204.800-78Q201-78 198.600-75.600Q196.200-73.200 196.200-68.400L196.200-68.400L196.200 0L171 0L171-69.600Q171-73.800 168.700-75.900Q166.400-78 163.200-78L163.200-78Q159.600-78 157.200-75.600Q154.800-73.200 154.800-68.400L154.800-68.400L154.800 0Z"
      />
    </svg>
  );
}
