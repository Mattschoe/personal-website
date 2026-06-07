import { Link, useParams } from 'react-router-dom';
import { getRecipe } from '../content';
import { Markdown } from '../content/Markdown';
import { Image } from '../components/Image';
import { Seo } from '../seo/Seo';
import { recipeJsonLd } from '../seo/meta';
import { NotFound } from './NotFound';
import styles from './RecipeDetail.module.css';

// Single recipe: breadcrumb → split hero (intro + square photo) → stat strip
// (time / yield / effort) → the rendered Markdown body in a `.read` column
// (clean, blog-aligned) → 2-column layout with a sticky ingredients checklist,
// a numbered method timeline, and an optional "note" callout. The hero photo
// stays a `.ph` placeholder until real imagery lands in Phase 8.
export function RecipeDetail() {
  const { slug } = useParams();
  const recipe = slug ? getRecipe(slug) : undefined;
  if (!recipe) return <NotFound />;

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
          <p className="lead">{recipe.excerpt}</p>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.k}>Time</span>
              <span className={styles.v}>{recipe.time}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.k}>Makes</span>
              <span className={styles.v}>{recipe.yield}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.k}>Effort</span>
              <span className={styles.v}>{recipe.effort}</span>
            </div>
          </div>
        </div>
        <Image
          src={recipe.hero}
          alt={recipe.heroAlt ?? recipe.title}
          tone="grenadine"
          label="Finished dish · square"
          eager
        />
      </section>

      <Markdown className={styles.intro}>{recipe.body}</Markdown>

      <section className={styles.recipeBody}>
        <aside className={styles.ingredients}>
          <h2>Ingredients</h2>
          <ul className={styles.ingList}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <span className={styles.amt}>{ing.amount}</span>
                <span>{ing.item}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.method}>
          <h2>Method</h2>
          <ol className={styles.steps}>
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          {recipe.note && (
            <div className={styles.note}>
              <span className="kicker">Matt&apos;s note</span>
              <p>{recipe.note}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
