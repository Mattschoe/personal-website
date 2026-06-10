import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Home } from './Home';
import { ThemeProvider } from '../components/ThemeProvider';
import { getLatestFeed, formatDate } from '../content';

function renderHome() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
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

  it('shows the author caption on a feed card when one is set, not the excerpt', () => {
    // Caption is a home-card-only override; the index pages keep the excerpt.
    const captioned = rest.find((item) => item.caption && item.caption !== item.excerpt);
    expect(captioned, 'fixtures should put a captioned item in the home feed').toBeTruthy();
    const { container } = renderHome();
    const card = [...container.querySelectorAll('a.card')].find(
      (c) => c.getAttribute('href') === captioned!.href,
    );
    const scope = within(card as HTMLElement);
    expect(scope.getByText(captioned!.caption!)).toBeInTheDocument();
    expect(scope.queryByText(captioned!.excerpt)).not.toBeInTheDocument();
  });

  it('renders no blurb on a card that has no caption (no excerpt fallback)', () => {
    const plain = rest.find((item) => !item.caption);
    expect(plain, 'fixtures should include an uncaptioned feed item').toBeTruthy();
    const { container } = renderHome();
    const card = [...container.querySelectorAll('a.card')].find(
      (c) => c.getAttribute('href') === plain!.href,
    );
    expect((card as HTMLElement).querySelector('.card-excerpt')).toBeNull();
  });

  it('renders a feed card image only when the item has a hero — never a placeholder', () => {
    const { container } = renderHome();
    const cards = container.querySelectorAll('a.card');

    rest.forEach((item, i) => {
      const card = cards[i] as HTMLElement;
      if (item.hero) {
        expect(card.querySelector('img')).not.toBeNull();
      } else {
        // No image — and crucially no toned `.ph` placeholder box either.
        expect(card.querySelector('img')).toBeNull();
        expect(card.querySelector('.ph')).toBeNull();
        // Title still carries the card with no image.
        expect(within(card).getByText(item.title)).toBeInTheDocument();
      }
    });
  });

  it('drops the image on the featured card when it has no hero, keeping title + meta', () => {
    const { container } = renderHome();
    const featuredEl = container.querySelector('a.featured') as HTMLElement;
    const scope = within(featuredEl);

    if (featured.hero) {
      expect(featuredEl.querySelector('img')).not.toBeNull();
    } else {
      expect(featuredEl.querySelector('img')).toBeNull();
      expect(featuredEl.querySelector('.ph')).toBeNull();
    }
    // Title renders regardless of whether an image is present.
    expect(scope.getByText(featured.title)).toBeInTheDocument();
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
