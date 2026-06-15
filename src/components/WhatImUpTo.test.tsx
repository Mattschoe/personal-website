import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WhatImUpTo } from './WhatImUpTo';
import type { GithubActivity } from '../data/github-activity';

const fixture: GithubActivity = {
  generatedAt: '2026-06-15T08:00:00Z',
  login: 'Mattschoe',
  calendar: {
    totalContributions: 1386,
    weeks: [
      { days: [{ date: '2025-06-15', count: 0 }, { date: '2025-06-16', count: 4 }] },
      { days: [{ date: '2025-06-22', count: 12 }, { date: '2025-06-23', count: 1 }] },
    ],
  },
  month: {
    label: 'June 2026',
    totalCommits: 112,
    repositories: [
      { name: 'Mattschoe/personal-website', url: 'https://github.com/Mattschoe/personal-website', commits: 94 },
      { name: 'Mattschoe/grammar-check', url: 'https://github.com/Mattschoe/grammar-check', commits: 2 },
    ],
  },
};

describe('WhatImUpTo', () => {
  it('renders the section heading', () => {
    render(<WhatImUpTo data={fixture} />);
    expect(screen.getByRole('heading', { name: /what i'm up to/i })).toBeInTheDocument();
  });

  it('summarises this month as "Created N commits in M repositories"', () => {
    const { container } = render(<WhatImUpTo data={fixture} />);
    const summary = container.querySelector('p');
    expect(summary?.textContent).toBe('Created 112 commits in 2 repositories');
  });

  it('lists each repository as a link with its commit count', () => {
    render(<WhatImUpTo data={fixture} />);
    const link = screen.getByRole('link', { name: 'Mattschoe/personal-website' });
    expect(link).toHaveAttribute('href', 'https://github.com/Mattschoe/personal-website');
    const row = link.closest('li') as HTMLElement;
    expect(within(row).getByText('94 commits')).toBeInTheDocument();
  });

  it('renders one heatmap cell per contribution day, labelled with the year total', () => {
    const { container } = render(<WhatImUpTo data={fixture} />);
    const heatmap = screen.getByRole('img', { name: /1,386 contributions in the last year/i });
    expect(heatmap.querySelectorAll('[data-level]')).toHaveLength(4);
    // An empty day gets level 0; a day with activity gets a positive level.
    expect(container.querySelector('[title^="0 contributions"]')).toHaveAttribute('data-level', '0');
    const active = container.querySelector('[title^="12 contributions"]');
    expect(Number(active?.getAttribute('data-level'))).toBeGreaterThan(0);
  });

  it('handles a month with no commits', () => {
    const empty: GithubActivity = { ...fixture, month: { label: 'June 2026', totalCommits: 0, repositories: [] } };
    render(<WhatImUpTo data={empty} />);
    expect(screen.getByText('No commits yet this month.')).toBeInTheDocument();
  });
});
