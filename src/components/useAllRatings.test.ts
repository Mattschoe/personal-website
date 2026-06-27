import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useAllRatings } from './useAllRatings';
import * as ratings from '../data/ratings';

/** A fetch Response stub carrying `data` as JSON. */
function ok(data: unknown) {
  return { ok: true, json: async () => data };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useAllRatings', () => {
  it('seeds from the snapshot, then merges the live /api/ratings response', async () => {
    vi.spyOn(ratings, 'getRatings').mockReturnValue({
      generatedAt: '2026-01-01T00:00:00.000Z',
      ratings: { soup: { count: 1, average: 5 } },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      ok({ generatedAt: 'now', ratings: { soup: { count: 9, average: 4.2 }, stew: { count: 2, average: 3 } } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAllRatings());

    // First render is the snapshot (hydration-safe).
    expect(result.current).toEqual({ soup: { count: 1, average: 5 } });

    // After the fetch resolves, live numbers replace it.
    await waitFor(() => {
      expect(result.current.soup).toEqual({ count: 9, average: 4.2 });
    });
    expect(result.current.stew).toEqual({ count: 2, average: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/ratings');
  });

  it('keeps the snapshot when the service is unreachable (fail-soft)', async () => {
    vi.spyOn(ratings, 'getRatings').mockReturnValue({
      generatedAt: '2026-01-01T00:00:00.000Z',
      ratings: { soup: { count: 1, average: 5 } },
    });
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current).toEqual({ soup: { count: 1, average: 5 } });
  });
});
