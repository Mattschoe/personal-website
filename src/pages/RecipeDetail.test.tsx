import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect, beforeEach } from 'vitest';
import { RecipeDetail } from './RecipeDetail';
import { getRecipes } from '../content';

function renderRecipe(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/recipes/${slug}`]}>
      <Routes>
        <Route path="/recipes/:slug" element={<RecipeDetail />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: HelmetProvider },
  );
}

const recipes = getRecipes();
const withNote = recipes.find((r) => r.note);
const withoutNote = recipes.find((r) => !r.note);
const recipe = withNote ?? recipes[0];

describe('RecipeDetail', () => {
  beforeEach(() => localStorage.clear());

  it('renders the crumb (with category) and title — no "Recipe" badge', () => {
    renderRecipe(recipe.slug);

    expect(screen.queryByText('Recipe', { selector: '.tag' })).toBeNull();

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

  it('renders ingredient group headings and every grouped item', () => {
    const grouped = recipes.find(
      (r) => r.ingredientGroups && r.ingredientGroups.length > 1,
    );
    expect(grouped).toBeDefined();
    renderRecipe(grouped!.slug);

    const aside = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;

    grouped!.ingredientGroups!.forEach((group) => {
      if (group.heading) {
        expect(
          within(aside).getByRole('heading', { name: group.heading }),
        ).toBeInTheDocument();
      }
      group.items.forEach((ing) => {
        expect(within(aside).getByText(ing.item)).toBeInTheDocument();
      });
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

  it('ticks an ingredient checkbox and restores it on remount (persisted)', () => {
    const { unmount } = renderRecipe(recipe.slug);
    const aside = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;

    const box = within(aside).getAllByRole('checkbox')[0];
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(box).toBeChecked();

    // Remount from a fresh tree — state comes back from localStorage.
    unmount();
    renderRecipe(recipe.slug);
    const aside2 = screen
      .getByRole('heading', { name: 'Ingredients' })
      .closest('aside') as HTMLElement;
    expect(within(aside2).getAllByRole('checkbox')[0]).toBeChecked();
  });

  it('toggles a method step by clicking its text (no checkbox)', () => {
    renderRecipe(recipe.slug);
    const method = screen
      .getByRole('heading', { name: 'Method' })
      .closest('div') as HTMLElement;
    // Steps have no checkbox — the step text itself is the toggle button.
    expect(within(method).queryByRole('checkbox')).toBeNull();
    const stepBtn = within(method).getAllByRole('button')[0];
    expect(stepBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(stepBtn);
    expect(stepBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders NotFound for an unknown slug', () => {
    renderRecipe('does-not-exist');
    expect(
      screen.queryByRole('heading', { level: 1, name: recipe.title }),
    ).toBeNull();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
