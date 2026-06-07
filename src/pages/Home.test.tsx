import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Home } from './Home';
import { getLatestFeed, formatDate } from '../content';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
    { wrapper: HelmetProvider },
  );
}

const feed = getLatestFeed(4);
const featured = feed[0];
const rest = feed.slice(1);

const TAG_LABEL = { recipe: 'Recipe', project: 'Project', essay: 'Essay' } as const;
const TAG_CLASS = {
  recipe: 'tag--recipe',
  project: 'tag--project',
  essay: 'tag--essay',
} as const;

describe('Home', () => {
  it('features the newest feed item with its href and year-stamped date', () => {
    const { container } = renderHome();
    const featuredEl = container.querySelector('a.featured');
    expect(featuredEl).not.toBeNull();
    expect(featuredEl).toHaveAttribute('href', featured.href);

    const scope = within(featuredEl as HTMLElement);
    expect(scope.getByText(featured.title)).toBeInTheDocument();
    expect(scope.getByText(formatDate(featured.date, { withYear: true }))).toBeInTheDocument();

    const tag = scope.getByText(TAG_LABEL[featured.type]);
    expect(tag).toHaveClass('tag', TAG_CLASS[featured.type]);
  });

  it('renders exactly the three remaining items as feed cards', () => {
    const { container } = renderHome();
    const cards = container.querySelectorAll('a.card');
    expect(cards).toHaveLength(3);

    rest.forEach((item, i) => {
      const scope = within(cards[i] as HTMLElement);
      expect(cards[i]).toHaveAttribute('href', item.href);
      expect(scope.getByText(item.title)).toBeInTheDocument();
      // Feed cards use the year-less date form.
      expect(scope.getByText(formatDate(item.date))).toBeInTheDocument();

      const tag = scope.getByText(TAG_LABEL[item.type]);
      expect(tag).toHaveClass('tag', TAG_CLASS[item.type]);
    });
  });

  it('shows the hero lead as a literal TODO placeholder', () => {
    renderHome();
    expect(screen.getByText(/TODO: write hero lead copy/i)).toBeInTheDocument();
  });

  it('exposes the #about anchor target for the header link', () => {
    const { container } = renderHome();
    const about = container.querySelector('#about');
    expect(about).not.toBeNull();
    expect(within(about as HTMLElement).getByText('About me')).toBeInTheDocument();
  });

  it('wires the "Get in touch" CTA to the contact email', () => {
    renderHome();
    const cta = screen.getByRole('link', { name: /get in touch/i });
    expect(cta).toHaveAttribute('href', 'mailto:matthias.s.nielsen@protonmail.com');
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    // Home is a child of Layout's <main>; adding another here would nest the
    // main landmark (invalid + an a11y violation).
    const { container } = renderHome();
    expect(container.querySelector('main')).toBeNull();
  });
});
