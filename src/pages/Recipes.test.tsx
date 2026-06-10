import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Recipes } from './Recipes';
import { getRecipes } from '../content';

function renderRecipes(entry = '/recipes') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Recipes />
    </MemoryRouter>,
    { wrapper: HelmetProvider },
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
      // Index cards show the excerpt; the author `caption` is a home-card-only
      // override and must never surface here.
      expect(scope.getByText(recipe.excerpt)).toBeInTheDocument();
      expect(scope.getByText(recipe.category)).toBeInTheDocument();
      expect(scope.getByText(recipe.time)).toBeInTheDocument();
    });
  });

  it('shows the excerpt — not the author caption — even when a caption is set', () => {
    const captioned = recipes.find((r) => r.caption && r.caption !== r.excerpt);
    expect(captioned, 'fixtures should include a captioned recipe').toBeTruthy();
    const { container } = renderRecipes();
    const card = [...cards(container)].find(
      (c) => c.getAttribute('href') === `/recipes/${captioned!.slug}`,
    );
    const scope = within(card as HTMLElement);
    // The caption belongs to the home cards only; the index keeps the excerpt.
    expect(scope.getByText(captioned!.excerpt)).toBeInTheDocument();
    expect(scope.queryByText(captioned!.caption!)).not.toBeInTheDocument();
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

  it('narrows the grid to recipes whose title matches the search query', () => {
    const target = recipes[0];
    // A distinctive slice of the first recipe's title that the others are
    // unlikely to share.
    const term = target.title.slice(0, 4);
    const expected = recipes.filter((r) =>
      r.title.toLowerCase().includes(term.toLowerCase()),
    );
    const { container } = renderRecipes();

    fireEvent.change(screen.getByRole('searchbox', { name: /search recipes/i }), {
      target: { value: term },
    });

    expect(cards(container)).toHaveLength(expected.length);
    expect(screen.getByText(target.title)).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches the search', () => {
    const { container } = renderRecipes();
    fireEvent.change(screen.getByRole('searchbox', { name: /search recipes/i }), {
      target: { value: 'zzzznotarealrecipe' },
    });
    expect(cards(container)).toHaveLength(0);
    expect(screen.getByText(/no recipes match/i)).toBeInTheDocument();
  });

  it('combines the category filter with the search query', () => {
    const category = categories[0];
    const inCategory = recipes.filter((r) => r.category === category);
    const target = inCategory[0];
    const term = target.title.slice(0, 4);
    const expected = inCategory.filter((r) =>
      r.title.toLowerCase().includes(term.toLowerCase()),
    );
    const { container } = renderRecipes();

    fireEvent.click(screen.getByRole('button', { name: category }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search recipes/i }), {
      target: { value: term },
    });

    expect(cards(container)).toHaveLength(expected.length);
    expect(screen.getByRole('button', { name: category })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('honours a ?q= query on load (after mount, hydration-safe)', () => {
    const target = recipes[0];
    const term = target.title.slice(0, 4);
    const expected = recipes.filter((r) =>
      r.title.toLowerCase().includes(term.toLowerCase()),
    );
    const { container } = renderRecipes(`/recipes?q=${encodeURIComponent(term)}`);
    expect(cards(container)).toHaveLength(expected.length);
    expect(screen.getByRole('searchbox', { name: /search recipes/i })).toHaveValue(
      term,
    );
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    const { container } = renderRecipes();
    expect(container.querySelector('main')).toBeNull();
  });
});
