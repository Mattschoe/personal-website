import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import { Projects } from './Projects';
import { getProjects } from '../content';

function renderProjects() {
  return render(
    <MemoryRouter>
      <Projects />
    </MemoryRouter>,
    { wrapper: HelmetProvider },
  );
}

const projects = getProjects();

describe('Projects index', () => {
  it('renders one row per project, newest-first, each linking to its slug', () => {
    const { container } = renderProjects();
    const rows = container.querySelectorAll('a[href^="/projects/"]');
    expect(rows).toHaveLength(projects.length);

    // getProjects() is pre-sorted newest-first; rows preserve that order.
    projects.forEach((project, i) => {
      const row = rows[i];
      expect(row).toHaveAttribute('href', `/projects/${project.slug}`);
      const scope = within(row as HTMLElement);
      expect(scope.getByText(project.title)).toBeInTheDocument();
      expect(scope.getByText(project.summary)).toBeInTheDocument();
      expect(scope.getByText(project.status)).toBeInTheDocument();
      expect(scope.getByText(String(project.year))).toBeInTheDocument();
      // One chip per stack entry.
      project.stack.forEach((tech) => {
        expect(scope.getByText(tech)).toBeInTheDocument();
      });
    });
  });

  it('renders a bare "Projects" head with no editorial lead', () => {
    const { container } = renderProjects();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Projects' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.lead')).toBeNull();
  });

  it('renders no <main> of its own — Layout owns that landmark', () => {
    const { container } = renderProjects();
    expect(container.querySelector('main')).toBeNull();
  });
});
