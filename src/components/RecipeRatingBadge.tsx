import { getRating, starFill, type Rating } from '../data/ratings';
import styles from './RecipeRatingBadge.module.css';

// A compact, read-only rating shown at the bottom-left of recipe cards (Home
// feed + Recipes index). Read-only, no interactivity — cards stay static.
// Renders nothing until a recipe has ≥1 real vote, mirroring the detail widget's
// empty count slot.
//
// Numbers come from the `rating` prop when provided (the page passes a live value
// from useAllRatings) and otherwise fall back to the baked build-time snapshot
// (getRating) — so it's correct in SSG/offline and upgrades to live after mount.
//
// The interactive widget on the recipe page is RecipeRating; this is its quiet
// card-sized cousin, sharing only the pure starFill helper.

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

// `pinned` (default) drops `margin-top:auto` so the badge sticks to the bottom
// of a `.card` flex column; pass `pinned={false}` inside a vertically-centered
// container (the Home featured body) where it should sit in normal flow.
export function RecipeRatingBadge({
  slug,
  pinned = true,
  rating: override,
}: {
  slug: string;
  pinned?: boolean;
  rating?: Rating;
}) {
  const rating = override ?? getRating(slug);
  if (!rating || rating.count < 1) return null;

  const { average, count } = rating;
  const label = `${average.toFixed(1)} out of 5 from ${count} ${plural(count, 'rating', 'ratings')}`;

  return (
    <div className={`${styles.badge} ${pinned ? styles.pinned : ''}`}>
      <span className={styles.stars} role="img" aria-label={label}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={styles.star} aria-hidden="true">
            <span
              className={styles.starFill}
              style={{ width: `${starFill(average, i) * 100}%` }}
            />
          </span>
        ))}
      </span>
      <span className={styles.count}>({count})</span>
    </div>
  );
}
