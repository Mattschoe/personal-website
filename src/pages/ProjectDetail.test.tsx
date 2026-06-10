import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { ProjectDetail } from './ProjectDetail';
import { getProjects } from '../content';

function renderProject(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: HelmetProvider },
  );
}

const projects = getProjects();
// A project carrying all three external links (exercises every action button)
// — also the one with metrics in the seed set.
const full = projects.find(
  (p) => p.links?.repo && p.links?.demo && p.links?.docs,
)!;
// A project missing at least one link and with no metrics (exercises the
// conditional-render branches).
const partial = projects.find(
  (p) => !p.metrics && !(p.links?.repo && p.links?.demo && p.links?.docs),
)!;

describe('ProjectDetail', () => {
  it('has seed fixtures covering both the full and partial cases', () => {
    expect(full).toBeDefined();
    expect(partial).toBeDefined();
  });

  it('renders the crumb, title and summary lead (no stream tag)', () => {
    renderProject(full.slug);

    expect(screen.queryByText('Project', { selector: '.tag' })).toBeNull();

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: full.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(full.summary)).toBeInTheDocument();
  });

  it('renders an action button per present link, opening externally', () => {
    renderProject(full.slug);

    const github = screen.getByRole('link', { name: /View on GitHub/ });
    expect(github).toHaveAttribute('href', full.links!.repo);
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'));

    expect(screen.getByRole('link', { name: /Live demo/ })).toHaveAttribute(
      'href',
      full.links!.demo,
    );
    expect(screen.getByRole('link', { name: /Read the docs/ })).toHaveAttribute(
      'href',
      full.links!.docs,
    );
  });

  it('omits action buttons for links that are absent', () => {
    renderProject(partial.slug);
    if (!partial.links?.repo) {
      expect(screen.queryByRole('link', { name: /View on GitHub/ })).toBeNull();
    }
    if (!partial.links?.demo) {
      expect(screen.queryByRole('link', { name: /Live demo/ })).toBeNull();
    }
    if (!partial.links?.docs) {
      expect(screen.queryByRole('link', { name: /Read the docs/ })).toBeNull();
    }
  });

  it('renders the spec rail with stack, role, status and year', () => {
    const { container } = renderProject(full.slug);
    const spec = container.querySelector('aside');
    expect(spec).not.toBeNull();
    const scope = within(spec as HTMLElement);

    expect(scope.getByText('Stack')).toBeInTheDocument();
    full.stack.forEach((tech) => {
      expect(scope.getByText(tech)).toBeInTheDocument();
    });
    expect(scope.getByText('Role')).toBeInTheDocument();
    expect(scope.getByText(full.role)).toBeInTheDocument();
    expect(scope.getByText('Status')).toBeInTheDocument();
    expect(scope.getByText(full.status)).toBeInTheDocument();
    expect(scope.getByText('Year')).toBeInTheDocument();
    expect(scope.getByText(String(full.year))).toBeInTheDocument();
  });

  it('shows the Numbers block only when metrics are set', () => {
    const { container: withMetrics } = renderProject(full.slug);
    expect(within(withMetrics).getByText('Numbers')).toBeInTheDocument();
    expect(within(withMetrics).getByText(full.metrics!)).toBeInTheDocument();

    const { container: withoutMetrics } = renderProject(partial.slug);
    expect(within(withoutMetrics).queryByText('Numbers')).toBeNull();
  });

  it('renders the body in a .read column with no dropcap', () => {
    const { container } = renderProject(full.slug);
    const paragraphs = container.querySelectorAll('.read p');
    expect(paragraphs.length).toBeGreaterThan(0);
    paragraphs.forEach((p) => expect(p).not.toHaveClass('dropcap'));
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    const { container } = renderProject(full.slug);
    expect(container.querySelector('main')).toBeNull();
  });

  it('renders NotFound for an unknown slug', () => {
    renderProject('does-not-exist');
    expect(
      screen.queryByRole('heading', { level: 1, name: full.title }),
    ).toBeNull();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
