import { Link, useParams } from 'react-router-dom';
import { getProject } from '../content';
import { Markdown } from '../content/Markdown';
import { NotFound } from './NotFound';

// Minimal placeholder detail page (Phase 3): proves content-driven routing and
// renders the Markdown body. The full case-study + spec-rail template lands in
// Phase 7.
export function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? getProject(slug) : undefined;
  if (!project) return <NotFound />;

  return (
    <article className="section">
      <div className="container">
        <p>
          <Link className="arrow-link" to="/projects">
            <span className="ar">&#8599;</span> Projects
          </Link>
        </p>
        <span className="kicker">Project</span>
        <h1>{project.title}</h1>
        <p className="lead">{project.summary}</p>
        <Markdown>{project.body}</Markdown>
        <p className="kicker">Full project template lands in Phase 7.</p>
      </div>
    </article>
  );
}
