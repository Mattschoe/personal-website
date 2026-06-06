import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { RecipeDetail } from './RecipeDetail';
import { getRecipes } from '../content';

function renderRecipe(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/recipes/${slug}`]}>
      <Routes>
        <Route path="/recipes/:slug" element={<RecipeDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

const recipes = getRecipes();
const withNote = recipes.find((r) => r.note);
const withoutNote = recipes.find((r) => !r.note);
const recipe = withNote ?? recipes[0];

describe('RecipeDetail', () => {
  it('renders the Recipe tag, crumb (with category) and title', () => {
    renderRecipe(recipe.slug);

    const tag = screen.getByText('Recipe', { selector: '.tag' });
    expect(tag).toHaveClass('tag', 'tag--recipe');

    expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute(
      'href',
      '/recipes',
    );
    expect(screen.getByText(recipe.category)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: recipe.title }),
    ).toBeInTheDocument();
  });

  it('renders the stat strip with time, yield and effort', () => {
    renderRecipe(recipe.slug);
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Makes')).toBeInTheDocument();
    expect(screen.getByText('Effort')).toBeInTheDocument();
    expect(screen.getByText(recipe.time)).toBeInTheDocument();
    expect(screen.getByText(recipe.yield)).toBeInTheDocument();
    expect(screen.getByText(recipe.effort)).toBeInTheDocument();
  });

  it('lists every ingredient with its amount and item', () => {
    renderRecipe(recipe.slug);
    const aside = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;
    const list = within(aside).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(recipe.ingredients.length);
    recipe.ingredients.forEach((ing, i) => {
      const scope = within(items[i]);
      expect(scope.getByText(ing.amount)).toBeInTheDocument();
      expect(scope.getByText(ing.item)).toBeInTheDocument();
    });
  });

  it('renders the method steps in order', () => {
    renderRecipe(recipe.slug);
    const steps = within(
      screen.getByRole('heading', { name: 'Method' }).closest('div') as HTMLElement,
    )
      .getByRole('list')
      .querySelectorAll('li');
    expect(steps).toHaveLength(recipe.steps.length);
    recipe.steps.forEach((step, i) => {
      expect(steps[i]).toHaveTextContent(step);
    });
  });

  it('renders the note callout when the recipe has one', () => {
    expect(withNote).toBeDefined();
    renderRecipe(withNote!.slug);
    expect(screen.getByText(/Matt's note/i)).toBeInTheDocument();
    expect(screen.getByText(withNote!.note!)).toBeInTheDocument();
  });

  it('omits the note callout when the recipe has none', () => {
    expect(withoutNote).toBeDefined();
    renderRecipe(withoutNote!.slug);
    expect(screen.queryByText(/Matt's note/i)).toBeNull();
  });

  it('renders the Markdown body in a .read column', () => {
    const { container } = renderRecipe(recipe.slug);
    expect(container.querySelector('.read')).not.toBeNull();
  });

  it('renders NotFound for an unknown slug', () => {
    renderRecipe('does-not-exist');
    expect(
      screen.queryByRole('heading', { level: 1, name: recipe.title }),
    ).toBeNull();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
