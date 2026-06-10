import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRecipes, truncate } from '../content';
import { Image } from '../components/Image';
import { Seo } from '../seo/Seo';
import styles from './Recipes.module.css';

// Tones cycle through the placeholder palette so the grid has visual variety
// until real photos land in Phase 8.
const TONES = ['grenadine', 'beeswax', 'latte', 'sage'] as const;

// Recipes index: a 3-up card grid driven by getRecipes() plus functional
// category filter chips and a title search. The chip list is *derived* from the
// categories present in content (Rule 4 — adding a recipe needs no code edit
// here), and both the active filter and the search query sync to the URL
// (`?category=` / `?q=`) so filtered views are shareable.
export function Recipes() {
  const recipes = getRecipes();

  // Unique categories in first-appearance order (recipes are pre-sorted
  // newest-first), with a leading "All".
  const categories = ['All', ...new Set(recipes.map((r) => r.category))];

  // The page is prerendered at `/recipes` with no query, so the static HTML
  // shows every recipe. Render "All"/empty until mounted, then derive the active
  // filter + query straight from the URL — keeps hydration in sync (same trick
  // ThemeProvider uses) without a redundant copy of the params in state.
  const [params, setParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted ? (params.get('category') ?? 'All') : 'All';
  const query = mounted ? (params.get('q') ?? '') : '';

  // Mutate the existing params so category + q coexist; drop a param when empty
  // to keep URLs clean.
  function patchParams(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  function select(category: string) {
    patchParams({ category: category === 'All' ? '' : category });
  }

  const q = query.trim().toLowerCase();
  const visible = recipes.filter(
    (r) =>
      (active === 'All' || r.category === active) &&
      (q === '' || r.title.toLowerCase().includes(q)),
  );

  return (
    <>
      <Seo
        title="Recipes"
        description="Recipes I cook and come back to — straightforward food with the notes that make it work."
      />
      <section className={`container ${styles.pageHead}`}>
        <h1>Recipes</h1>
        <input
          className={styles.search}
          type="search"
          value={query}
          placeholder="Search recipes…"
          aria-label="Search recipes by title"
          onChange={(e) => patchParams({ q: e.target.value })}
        />
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
        {visible.length === 0 ? (
          <p className={styles.empty}>No recipes match your search.</p>
        ) : (
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
                <p className="card-excerpt">{truncate(recipe.excerpt)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
