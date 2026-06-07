import { Link, useParams } from 'react-router-dom';
import { getRecipe, type Recipe } from '../content';
import { Markdown } from '../content/Markdown';
import { Image } from '../components/Image';
import { useRecipeChecklist } from '../components/useRecipeChecklist';
import { Seo } from '../seo/Seo';
import { recipeJsonLd } from '../seo/meta';
import { NotFound } from './NotFound';
import styles from './RecipeDetail.module.css';

// Tones cycle through the placeholder palette so pairing cards without a real
// photo still get visual variety (matches the Recipes index grid).
const PAIR_TONES = ['grenadine', 'beeswax', 'latte', 'sage'] as const;

// Single recipe: breadcrumb → split hero (square photo on the right; left column
// reads top-down: title flush with the photo top → stat strip (time / yield) →
// the rendered Markdown body article-style in a `.read` column) → 2-column layout
// with a sticky ingredients checklist, a numbered method timeline, and an
// optional "note" callout. The hero photo stays a `.ph` placeholder until real
// imagery lands in Phase 8.
export function RecipeDetail() {
  const { slug } = useParams();
  const recipe = slug ? getRecipe(slug) : undefined;
  // Hooks must run unconditionally; pass a stable empty slug for the not-found
  // case (its checklist is never rendered).
  const { isChecked, toggle } = useRecipeChecklist(recipe?.slug ?? '');
  if (!recipe) return <NotFound />;

  // Resolve pairings to real recipes (parse-time validation guarantees they
  // exist, but guard anyway so a stale reference never renders a dead card).
  const pairs = (recipe.pairsWith ?? [])
    .map((s) => getRecipe(s))
    .filter((r): r is Recipe => Boolean(r));

  const groups = recipe.ingredientGroups ?? [{ items: recipe.ingredients }];
  // Running offset so each ingredient gets a stable flat index across groups —
  // the index the checklist persists, independent of how items are grouped.
  const groupOffsets: number[] = [];
  groups.reduce((acc, g, i) => {
    groupOffsets[i] = acc;
    return acc + g.items.length;
  }, 0);

  return (
    <div className="container">
      <Seo
        title={recipe.title}
        description={recipe.excerpt}
        image={recipe.hero}
        type="article"
        jsonLd={recipeJsonLd(recipe)}
      />
      <nav className={styles.crumb}>
        <Link to="/recipes">Recipes</Link> <span>/</span>{' '}
        <span>{recipe.category}</span>
      </nav>

      <section className={styles.recipeHero}>
        <div>
          <h1>{recipe.title}</h1>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.k}>Time</span>
              <span className={styles.v}>{recipe.time}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.k}>Makes</span>
              <span className={styles.v}>{recipe.yield}</span>
            </div>
          </div>
          <Markdown className={styles.heroBody}>{recipe.body}</Markdown>
        </div>
        <Image
          src={recipe.hero}
          alt={recipe.heroAlt ?? recipe.title}
          tone="grenadine"
          label="Finished dish · square"
          eager
        />
      </section>

      <section className={styles.recipeBody}>
        <aside className={styles.ingredients}>
          <h2>Ingredients</h2>
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.heading && (
                <h3 className={styles.ingGroup}>{group.heading}</h3>
              )}
              <ul className={styles.ingList}>
                {group.items.map((ing, i) => {
                  const idx = groupOffsets[gi] + i;
                  const checked = isChecked('ingredients', idx);
                  return (
                    <li key={i} className={checked ? styles.checked : undefined}>
                      <label className={styles.ingLabel}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle('ingredients', idx)}
                        />
                        <span className={styles.ingText}>
                          <span className={styles.amt}>{ing.amount}</span>
                          {ing.item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        <div className={styles.method}>
          <h2>Method</h2>
          <ol className={styles.steps}>
            {recipe.steps.map((step, i) => {
              const checked = isChecked('steps', i);
              return (
                <li key={i} className={checked ? styles.checked : undefined}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    aria-pressed={checked}
                    onClick={() => toggle('steps', i)}
                  >
                    <span className={styles.stepText}>{step}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {recipe.note && (
            <div className={styles.note}>
              <span className="kicker">Matt&apos;s note</span>
              <p>{recipe.note}</p>
            </div>
          )}
        </div>
      </section>

      {pairs.length > 0 && (
        <section className={styles.pairs}>
          <h2>Goes well with</h2>
          <div className={styles.pairGrid}>
            {pairs.map((p, i) => (
              <Link
                key={p.slug}
                to={`/recipes/${p.slug}`}
                className={styles.pairCard}
              >
                <Image
                  src={p.hero}
                  alt={p.heroAlt ?? p.title}
                  tone={PAIR_TONES[i % PAIR_TONES.length]}
                  label="Hero photo · 4:3"
                />
                <span className={styles.pairBody}>
                  <span className={styles.pairTitle}>{p.title}</span>
                  <span className={styles.pairMeta}>
                    {p.category} · {p.time}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
