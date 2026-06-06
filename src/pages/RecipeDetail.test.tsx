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

  it('lists every ingredient (and group label) in order', () => {
    renderRecipe(recipe.slug);
    const aside = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;
    const list = within(aside).getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(recipe.ingredients.length);
    recipe.ingredients.forEach((ing, i) => {
      const scope = within(items[i]);
      if ('group' in ing) {
        expect(items[i]).toHaveTextContent(ing.group);
      } else {
        expect(scope.getByText(ing.amount)).toBeInTheDocument();
        expect(scope.getByText(ing.item)).toBeInTheDocument();
      }
    });
  });

  it('renders ingredient group labels as their own row, ahead of their items', () => {
    const grouped = recipes.find((r) => r.ingredients.some((ing) => 'group' in ing));
    expect(grouped).toBeDefined();
    renderRecipe(grouped!.slug);

    const aside = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;
    const items = within(within(aside).getByRole('list')).getAllByRole('listitem');
    const textOf = (el: HTMLElement) => el.textContent ?? '';

    let lastGroupIndex = -1;
    grouped!.ingredients.forEach((ing, i) => {
      if (!('group' in ing)) return;
      expect(items[i]).toHaveTextContent(ing.group);
      // CSS Modules scope the class name (e.g. `_ingGroup_6b7856`); match the
      // local name rather than asserting an exact (build-dependent) token.
      expect(items[i].className).toMatch(/ingGroup/);
      expect(i).toBeGreaterThan(lastGroupIndex);
      lastGroupIndex = i;
      // Every item up to the next group (or the list's end) belongs to this
      // group, and so must render after its label.
      for (let j = i + 1; j < grouped!.ingredients.length; j += 1) {
        const next = grouped!.ingredients[j];
        if ('group' in next) break;
        expect(textOf(items[j])).toContain(next.item);
      }
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
