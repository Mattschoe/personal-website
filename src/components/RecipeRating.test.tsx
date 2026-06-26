import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecipeRating } from './RecipeRating';
import { loadRatings, saveRatings } from './recipe-rating';

/** A fetch Response stub carrying `data` as JSON. */
function ok(data: unknown) {
  return { ok: true, json: async () => data };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RecipeRating', () => {
  it('shows the live average and count, and offers interactive stars', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ok({ slug: 'soup', count: 12, average: 4.3 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RecipeRating slug="soup" />);

    // Interactive group of five star buttons (not voted, service reachable).
    const group = await screen.findByRole('group', { name: /rate this recipe/i });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rate 5 stars' })).toBeInTheDocument();

    // Live count from the GET.
    expect(await screen.findByText('(12)')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/ratings/soup');
  });

  it('posts the vote on click, then locks the widget', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ slug: 'soup', count: 12, average: 4.3 })) // GET
      .mockResolvedValueOnce(ok({ slug: 'soup', count: 13, average: 4.4 })); // POST
    vi.stubGlobal('fetch', fetchMock);

    render(<RecipeRating slug="soup" />);

    const star = await screen.findByRole('button', { name: 'Rate 5 stars' });
    fireEvent.click(star);

    // POSTed the chosen value.
    await waitFor(() => {
      const post = fetchMock.mock.calls.find((c) => c[1]?.method === 'POST');
      expect(post).toBeTruthy();
      expect(post?.[0]).toBe('/api/ratings/soup');
      expect(JSON.parse(post?.[1].body).value).toBe(5);
    });

    // Locked: buttons gone, "You rated" shown, new count reflected, lock stored.
    await waitFor(() => {
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
    expect(screen.getByText('You rated')).toBeInTheDocument();
    expect(await screen.findByText('(13)')).toBeInTheDocument();
    expect(loadRatings().soup).toBe(5);
  });

  it('sends only one vote when stars are clicked in quick succession', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ slug: 'soup', count: 12, average: 4.3 })) // GET
      .mockResolvedValueOnce(ok({ slug: 'soup', count: 13, average: 4.4 })); // POST
    vi.stubGlobal('fetch', fetchMock);

    render(<RecipeRating slug="soup" />);

    // Two clicks before the lock re-renders the buttons away: the synchronous
    // re-entry guard must drop the second so only the first value is POSTed.
    const three = await screen.findByRole('button', { name: 'Rate 3 stars' });
    const five = screen.getByRole('button', { name: 'Rate 5 stars' });
    fireEvent.click(three);
    fireEvent.click(five);

    await waitFor(() => {
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    const posts = fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0][1].body).value).toBe(3);
    expect(loadRatings().soup).toBe(3);
  });

  it('stays read-only when this browser has already voted', async () => {
    saveRatings({ soup: 4 });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ok({ slug: 'soup', count: 12, average: 4.3 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<RecipeRating slug="soup" />);

    expect(await screen.findByText('(12)')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /4\.3 out of 5 from 12 ratings/i })).toBeInTheDocument();
  });

  it('falls back to read-only when the service is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    render(<RecipeRating slug="soup" />);

    // Service down → no interactive group, read-only image role on the snapshot.
    await waitFor(() => {
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('img', { name: /no ratings yet/i })).toBeInTheDocument();
  });
});
