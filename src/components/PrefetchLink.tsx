import { Link, type LinkProps } from 'react-router-dom';
import { prefetchImage } from './prefetch';

export interface PrefetchLinkProps extends LinkProps {
  /** Image URL to warm on hover/focus/touch — typically the destination page's
   *  `hero`. When unset, this behaves exactly like a plain `Link`. */
  prefetch?: string;
}

/**
 * A drop-in `Link` that prefetches an image the moment the user signals intent
 * to navigate — pointer hover, keyboard focus, or touch start. By the time the
 * click lands and the detail page renders, its hero is already cached, so it
 * appears instantly. Any handlers passed in still run (we compose, not replace).
 */
export function PrefetchLink({
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...rest
}: PrefetchLinkProps) {
  return (
    <Link
      {...rest}
      onMouseEnter={(e) => {
        prefetchImage(prefetch);
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        prefetchImage(prefetch);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        prefetchImage(prefetch);
        onTouchStart?.(e);
      }}
    />
  );
}
