import { Link, useParams } from 'react-router-dom';
import { getRecipe } from '../content';
import { Markdown } from '../content/Markdown';
import { NotFound } from './NotFound';

// Minimal placeholder detail page (Phase 3): proves content-driven routing and
// renders the Markdown body. The full split-hero / ingredients / method template
// lands in Phase 6.
export function RecipeDetail() {
  const { slug } = useParams();
  const recipe = slug ? getRecipe(slug) : undefined;
  if (!recipe) return <NotFound />;

  return (
    <article className="section">
      <div className="container">
        <p>
          <Link className="arrow-link" to="/recipes">
            <span className="ar">&#8599;</span> Recipes
          </Link>
        </p>
        <span className="kicker">Recipe</span>
        <h1>{recipe.title}</h1>
        <p className="lead">{recipe.excerpt}</p>
        <Markdown>{recipe.body}</Markdown>
        <p className="kicker">Full recipe template lands in Phase 6.</p>
      </div>
    </article>
  );
}
