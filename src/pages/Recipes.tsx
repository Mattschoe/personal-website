import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRecipes } from '../content';
import { Image } from '../components/Image';
import styles from './Recipes.module.css';

// Tones cycle through the placeholder palette so the grid has visual variety
// until real photos land in Phase 8.
const TONES = ['grenadine', 'beeswax', 'latte', 'sage'] as const;

// Recipes index: a 3-up card grid driven by getRecipes() plus functional
// category filter chips. The chip list is *derived* from the categories present
// in content (Rule 4 — adding a recipe needs no code edit here), and the active
// filter syncs to a `?category=` query so filtered views are shareable.
export function Recipes() {
  const recipes = getRecipes();

  // Unique categories in first-appearance order (recipes are pre-sorted
  // newest-first), with a leading "All".
  const categories = ['All', ...new Set(recipes.map((r) => r.category))];

  // The page is prerendered at `/recipes` with no query, so the static HTML
  // shows every recipe. Render "All" until mounted, then derive the active
  // filter straight from `?category=` — keeps hydration in sync (same trick
  // ThemeProvider uses) without a redundant copy of the query in state.
  const [params, setParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted ? (params.get('category') ?? 'All') : 'All';

  function select(category: string) {
    setParams(category === 'All' ? {} : { category }, { replace: true });
  }

  const visible =
    active === 'All' ? recipes : recipes.filter((r) => r.category === active);

  return (
    <>
      <section className={`container ${styles.pageHead}`}>
        <h1>Recipes</h1>
        <div
          className={styles.filters}
          role="group"
          aria-label="Filter by category"
        >
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={styles.chip}
              aria-pressed={active === category}
              onClick={() => select(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="container">
        <div className={styles.recipeGrid}>
          {visible.map((recipe, i) => (
            <Link className="card" to={`/recipes/${recipe.slug}`} key={recipe.slug}>
              <Image
                src={recipe.hero}
                alt={recipe.heroAlt ?? recipe.title}
                tone={TONES[i % TONES.length]}
                label="Hero photo · 4:3"
              />
              <div className="card-top">
                <span className="card-meta">{recipe.category}</span>
                <span className="card-meta">{recipe.time}</span>
              </div>
              <div className="card-title">{recipe.title}</div>
              <p className="card-excerpt">{recipe.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
