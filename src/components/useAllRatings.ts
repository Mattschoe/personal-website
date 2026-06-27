import { useEffect, useState } from 'react';
import { getRatings, type Rating } from '../data/ratings';

// Live ratings for every recipe, for the card badges on listing pages (Home
// feed + Recipes index). One `/api/ratings` request per page rather than one per
// card, seeded from the baked build-time snapshot so the static HTML and first
// client render agree (hydration-safe, mirroring useRecipeRating).
//
// Fail-soft: if the service is unreachable (local dev/preview with no /api, or
// downtime) the snapshot stands. The snapshot is itself only refreshed by the
// daily CI cron, so the live fetch is what makes a freshly-cast vote show on the
// cards immediately instead of up to a day later.

/** `{ [slug]: { count, average } }` — live where reachable, else the snapshot. */
export function useAllRatings(): Record<string, Rating> {
  const [ratings, setRatings] = useState<Record<string, Rating>>(() => getRatings().ratings);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ratings')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (cancelled) return;
        if (data?.ratings && typeof data.ratings === 'object') setRatings(data.ratings);
      })
      .catch(() => {
        // Unreachable → keep the snapshot.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ratings;
}
