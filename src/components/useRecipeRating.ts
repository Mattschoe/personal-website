import { useCallback, useEffect, useRef, useState } from 'react';
import { getRating } from '../data/ratings';
import { loadRatings, getOwnVote, recordOwnVote, saveRatings } from './recipe-rating';

// Per-recipe rating state for the RecipeRating widget.
//
// Hydration safety mirrors ThemeProvider/useRecipeChecklist: seed from the
// baked snapshot (getRating) so the static HTML and the first client render
// agree, flip `ready` only after mount, then load this browser's vote lock
// (localStorage) and fetch live numbers from the rating service.
//
// Fail-soft everywhere: if the service is unreachable (local dev/preview with
// no /api, or downtime) the GET rejects, `available` goes false, and the widget
// renders read-only on the snapshot. A failed POST drops the optimistic lock so
// the visitor can retry.

export interface RecipeRatingState {
  average: number;
  count: number;
  /** This browser has already voted (persistent localStorage lock). */
  hasVoted: boolean;
  /** False once the service is known unreachable → render read-only. */
  available: boolean;
  /** True after mount; gates interactivity so SSG HTML and first render agree. */
  ready: boolean;
  submit: (value: number) => void;
}

export function useRecipeRating(slug: string): RecipeRatingState {
  const seed = getRating(slug);
  const [average, setAverage] = useState(seed?.average ?? 0);
  const [count, setCount] = useState(seed?.count ?? 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [available, setAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  // Synchronous re-entry guard: `hasVoted` is async state, so two clicks in the
  // same tick both read the stale `false` and would each POST. This ref flips
  // immediately, so only the first click of a burst gets through.
  const submitting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setHasVoted(getOwnVote(loadRatings(), slug) !== undefined);
    setReady(true);

    fetch(`/api/ratings/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.count === 'number') setCount(data.count);
        if (typeof data?.average === 'number') setAverage(data.average);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const submit = useCallback(
    (value: number) => {
      if (submitting.current || hasVoted) return;
      submitting.current = true;
      // Optimistic lock: persist this browser's vote and lock the widget now.
      recordOwnVote(slug, value);
      setHasVoted(true);

      fetch(`/api/ratings/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          if (typeof data?.count === 'number') setCount(data.count);
          if (typeof data?.average === 'number') setAverage(data.average);
        })
        .catch(() => {
          // Couldn't record — drop the optimistic lock and stay interactive so
          // the visitor can try again this session. (Leaving `available` true is
          // deliberate: flipping it would make the widget read-only and prevent
          // the very retry we just freed up.)
          const store = loadRatings();
          delete store[slug];
          saveRatings(store);
          setHasVoted(false);
          submitting.current = false;
        });
    },
    [hasVoted, slug],
  );

  return { average, count, hasVoted, available, ready, submit };
}
