// Typed loader + pure derivations for recipe star ratings.
//
// The JSON is a build-time snapshot of the live ratings service, produced by
// scripts/fetch-ratings.mjs and committed as a fallback so dev/test/offline
// builds always have data (an empty object is fine). This module only reads it
// — no Node/filesystem access — so it's safe in the client graph and prerenders
// to static HTML. Mirrors the github-activity.ts typed-loader + pure-derivation
// split. The live widget fetches fresh numbers at runtime (useRecipeRating).

import raw from './ratings.json';

export interface Rating {
  count: number;
  average: number;
}

export interface RatingsSnapshot {
  generatedAt: string;
  ratings: Record<string, Rating>;
}

/** The build-time snapshot, typed. */
export function getRatings(): RatingsSnapshot {
  return raw as RatingsSnapshot;
}

/**
 * The baked rating for one recipe, or `undefined` when it has none yet. Returns
 * `undefined` (not a zero rating) so callers can distinguish "no ratings" — the
 * case where `aggregateRating` must be omitted from JSON-LD — from a real one.
 */
export function getRating(slug: string): Rating | undefined {
  const r = getRatings().ratings[slug];
  return r && r.count > 0 ? r : undefined;
}

/**
 * Fractional star fill (0..1) for star `index` (0-based) given an `average`.
 * Star i is full when average ≥ i+1, empty when average ≤ i, and partially
 * filled in between — drives the overlay width in RecipeRating. Clamped so a
 * stray out-of-range average can't overflow a star.
 */
export function starFill(average: number, index: number): number {
  return Math.min(1, Math.max(0, average - index));
}
