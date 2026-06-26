import { useState } from 'react';
import { starFill } from '../data/ratings';
import { useRecipeRating } from './useRecipeRating';
import styles from './RecipeRating.module.css';

// The visible 5-star rating widget, shown beside the recipe stat strip. It
// renders the community average as fractionally-filled stars plus `(count)`,
// and — until this browser has voted and while the service is reachable — lets
// a visitor rate once by clicking a star. Tokens only; honours
// prefers-reduced-motion via global CSS (transitions are disabled there).
//
// Data + persistence live in useRecipeRating; this component is the view.

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** One star cell filled `fill` (0..1) of the way across. */
function Star({ fill }: { fill: number }) {
  return (
    <span className={styles.star} aria-hidden="true">
      <span className={styles.starFill} style={{ width: `${fill * 100}%` }} />
    </span>
  );
}

export function RecipeRating({ slug }: { slug: string }) {
  const { average, count, hasVoted, available, ready, submit } = useRecipeRating(slug);
  const [hover, setHover] = useState(0);

  const interactive = ready && available && !hasVoted;

  const summary =
    count > 0
      ? `${average.toFixed(1)} out of 5 from ${count} ${plural(count, 'rating', 'ratings')}`
      : 'No ratings yet';

  // While hovering/focusing a star, preview a whole-star fill up to it;
  // otherwise show the fractional community average.
  const shown = hover > 0 ? hover : average;

  return (
    <div className={styles.rating}>
      <span className={styles.label}>{hasVoted ? 'You rated' : 'Rating'}</span>

      <span className={styles.row}>
        {interactive ? (
          <span
            className={styles.stars}
            role="group"
            aria-label={`Rate this recipe — ${summary}`}
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                className={styles.starButton}
                aria-label={`Rate ${v} ${plural(v, 'star', 'stars')}`}
                onClick={() => submit(v)}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(v)}
                onBlur={() => setHover(0)}
              >
                <Star fill={starFill(shown, v - 1)} />
              </button>
            ))}
          </span>
        ) : (
          <span className={styles.stars} role="img" aria-label={summary}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} fill={starFill(average, i)} />
            ))}
          </span>
        )}

        <span className={styles.count}>
          {count > 0 ? `(${count})` : interactive ? 'Rate it' : ''}
        </span>
      </span>
    </div>
  );
}
