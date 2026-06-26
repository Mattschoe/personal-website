import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RecipeRatingBadge } from './RecipeRatingBadge';
import * as ratings from '../data/ratings';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RecipeRatingBadge', () => {
  it('renders read-only stars and the count when the recipe has ratings', () => {
    vi.spyOn(ratings, 'getRating').mockReturnValue({ count: 12, average: 4.3 });

    const { container } = render(<RecipeRatingBadge slug="soup" />);

    expect(
      screen.getByRole('img', { name: /4\.3 out of 5 from 12 ratings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
    // No interactive controls — cards are static.
    expect(container.querySelector('button')).toBeNull();
  });

  it('uses the singular "rating" for a single vote', () => {
    vi.spyOn(ratings, 'getRating').mockReturnValue({ count: 1, average: 5 });

    render(<RecipeRatingBadge slug="soup" />);

    expect(
      screen.getByRole('img', { name: /5\.0 out of 5 from 1 rating$/i }),
    ).toBeInTheDocument();
  });

  it('renders nothing when the recipe has no ratings', () => {
    vi.spyOn(ratings, 'getRating').mockReturnValue(undefined);

    const { container } = render(<RecipeRatingBadge slug="soup" />);

    expect(container).toBeEmptyDOMElement();
  });
});
