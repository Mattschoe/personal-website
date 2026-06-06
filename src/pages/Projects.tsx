import { Link } from 'react-router-dom';
import { getProjects } from '../content';
import { Image } from '../components/Image';
import styles from './Projects.module.css';

// Tones cycle through the placeholder palette so the rows have visual variety
// until real screenshots land in Phase 8.
const TONES = ['sage', 'beeswax', 'grenadine', 'latte'] as const;

// Projects index: full-width alternating rows driven by getProjects()
// (pre-sorted newest-first). Drop a Markdown file in content/projects and it
// appears here on the next build (Rule 4). The alternating layout is pure CSS
// (:nth-child(even) flips the columns + media order) — the JSX stays uniform.
// Per Matt the page head is minimal (bare "Projects"), matching Blog/Recipes.
export function Projects() {
  const projects = getProjects();

  return (
    <>
      <section className={`container ${styles.pageHead}`}>
        <h1>Projects</h1>
      </section>

      <section className="container">
        <div className={styles.projList}>
          {projects.map((project, i) => (
            <Link
              className={styles.proj}
              to={`/projects/${project.slug}`}
              key={project.slug}
            >
              <div className={styles.projMedia}>
                <Image
                  src={project.hero}
                  alt={project.heroAlt ?? project.title}
                  tone={TONES[i % TONES.length]}
                  label="Project screenshot"
                />
              </div>
              <div className={styles.projBody}>
                <div className={styles.projTop}>
                  <span className={styles.status}>{project.status}</span>
                  <span className="card-meta">{project.year}</span>
                </div>
                <h3>{project.title}</h3>
                <p className="card-excerpt">{project.summary}</p>
                <div className={styles.stack}>
                  {project.stack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                <span className="arrow-link" style={{ marginTop: 'var(--s-2)' }}>
                  Case study <span className="ar">&#8599;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
