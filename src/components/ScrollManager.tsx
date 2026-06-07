import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Owns window scroll across client-side navigations. React Router otherwise
 * leaves the raw window offset untouched, landing a fresh page mid-scroll.
 *
 *  - Back/Forward (POP) returns to the offset the user left that entry at.
 *  - A new navigation to a hash (e.g. the header's `/#about`) scrolls that
 *    target into view; its `scroll-margin-top` clears the sticky header.
 *  - Any other new navigation starts at the top.
 *
 * Keyed on `location.key` — unique per history entry — so re-navigating to the
 * URL you're already on still re-runs (clicking "About" twice scrolls back to
 * it the second time too).
 */
export function ScrollManager() {
  const { hash, key } = useLocation();
  const navigationType = useNavigationType();
  // Scroll offset per history entry, keyed by location.key, so POP can return
  // the user to where they were. activeKey tracks which entry is on screen now.
  const positions = useRef(new Map<string, number>());
  const activeKey = useRef(key);

  // Take scroll restoration off the browser so our POP handling is the single
  // source of truth — no native restore racing the manual scrollTo below.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    const prior = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = prior;
    };
  }, []);

  // Continuously record the live offset against the active entry, so it's
  // already saved by the time the user navigates away.
  useEffect(() => {
    const remember = () => positions.current.set(activeKey.current, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, []);

  useEffect(() => {
    activeKey.current = key;

    if (navigationType === 'POP') {
      const saved = positions.current.get(key);
      if (saved !== undefined) {
        window.scrollTo(0, saved);
        return;
      }
    }
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [key, hash, navigationType]);

  return null;
}
