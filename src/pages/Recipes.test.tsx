import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Recipes } from './Recipes';
import { getRecipes } from '../content';

function renderRecipes(entry = '/recipes') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Recipes />
    </MemoryRouter>,
  );
}

const recipes = getRecipes();
const categories = [...new Set(recipes.map((r) => r.category))];

function cards(container: HTMLElement) {
  return container.querySelectorAll('a[href^="/recipes/"]');
}

describe('Recipes index', () => {
  it('renders one card per recipe with category + time meta and the right href', () => {
    const { container } = renderRecipes();
    const rendered = cards(container);
    expect(rendered).toHaveLength(recipes.length);

    recipes.forEach((recipe, i) => {
      const card = rendered[i];
      expect(card).toHaveAttribute('href', `/recipes/${recipe.slug}`);
      const scope = within(card as HTMLElement);
      expect(scope.getByText(recipe.title)).toBeInTheDocument();
      expect(scope.getByText(recipe.excerpt)).toBeInTheDocument();
      expect(scope.getByText(recipe.category)).toBeInTheDocument();
      expect(scope.getByText(recipe.time)).toBeInTheDocument();
    });
  });

  it('derives the chip list from content: All + each unique category', () => {
    renderRecipes();
    expect(
      screen.getByRole('button', { name: 'All' }),
    ).toHaveAttribute('aria-pressed', 'true');
    categories.forEach((category) => {
      expect(screen.getByRole('button', { name: category })).toBeInTheDocument();
    });
    // No stray chips beyond All + the unique categories.
    expect(screen.getAllByRole('button')).toHaveLength(categories.length + 1);
  });

  it('filters the grid to the chosen category and marks it pressed', () => {
    const category = categories[0];
    const expected = recipes.filter((r) => r.category === category);
    const { container } = renderRecipes();

    fireEvent.click(screen.getByRole('button', { name: category }));

    expect(cards(container)).toHaveLength(expected.length);
    expect(screen.getByRole('button', { name: category })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expected.forEach((recipe) => {
      expect(screen.getByText(recipe.title)).toBeInTheDocument();
    });
  });

  it('clicking All restores the full grid', () => {
    const { container } = renderRecipes();
    fireEvent.click(screen.getByRole('button', { name: categories[0] }));
    expect(cards(container).length).toBeLessThan(recipes.length);
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(cards(container)).toHaveLength(recipes.length);
  });

  it('honours a ?category= query on load (after mount, hydration-safe)', () => {
    const category = categories[0];
    const expected = recipes.filter((r) => r.category === category);
    const { container } = renderRecipes(
      `/recipes?category=${encodeURIComponent(category)}`,
    );
    expect(cards(container)).toHaveLength(expected.length);
    expect(screen.getByRole('button', { name: category })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    const { container } = renderRecipes();
    expect(container.querySelector('main')).toBeNull();
  });
});
