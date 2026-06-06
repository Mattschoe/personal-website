import { Link, useParams } from 'react-router-dom';
import { getProject } from '../content';
import { Markdown } from '../content/Markdown';
import { NotFound } from './NotFound';
import styles from './ProjectDetail.module.css';

// Single project (case study): breadcrumb → title + action buttons (GitHub /
// demo / docs, each rendered only when its link is present) → wide 16:8
// screenshot → 2-column layout with the rendered Markdown body in a `.read`
// article alongside a sticky spec rail (stack / role / status / year /
// numbers). The screenshot stays a `.ph` placeholder until real imagery lands
// in Phase 8. The body renders plain (no dropcap) — that prop is blog-only.
export function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? getProject(slug) : undefined;
  if (!project) return <NotFound />;

  const links = project.links;
  const hasActions = Boolean(links?.repo || links?.demo || links?.docs);

  return (
    <div className="container">
      <nav className={styles.crumb}>
        <Link to="/projects">Projects</Link> <span>/</span>{' '}
        <span>{project.title}</span>
      </nav>

      <section className={styles.projHead}>
        <span className="tag tag--project">Project</span>
        <h1>{project.title}</h1>
        <p className="lead">{project.summary}</p>
        {hasActions && (
          <div className={styles.projActions}>
            {links?.repo && (
              <a
                className="btn btn--accent"
                href={links.repo}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub <span>&#8599;</span>
              </a>
            )}
            {links?.demo && (
              <a
                className="btn"
                href={links.demo}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live demo <span>&#8599;</span>
              </a>
            )}
            {links?.docs && (
              <a
                className="btn"
                href={links.docs}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the docs
              </a>
            )}
          </div>
        )}
      </section>

      <div
        className={`ph ${styles.shot}`}
        data-tone="sage"
        data-ph="Primary screenshot · 16:8"
      ></div>

      <div className={styles.projLayout}>
        <Markdown className={styles.body}>{project.body}</Markdown>

        <aside className={styles.spec}>
          <div className={styles.specBlock}>
            <h4>Stack</h4>
            <div className={styles.stack}>
              {project.stack.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </div>
          <hr className={styles.divider} />
          <div className={styles.specBlock}>
            <h4>Role</h4>
            <p>{project.role}</p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.specBlock}>
            <h4>Status</h4>
            <p>{project.status}</p>
          </div>
          <hr className={styles.divider} />
          <div className={styles.specBlock}>
            <h4>Year</h4>
            <p>{project.year}</p>
          </div>
          {project.metrics && (
            <>
              <hr className={styles.divider} />
              <div className={styles.specBlock}>
                <h4>Numbers</h4>
                <p>{project.metrics}</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
