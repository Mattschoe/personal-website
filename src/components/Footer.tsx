import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <Link className="wordmark" to="/">
            Matt<span className="dot" />
          </Link>
          <p className="card-excerpt" style={{ maxWidth: '30ch' }}>
            Projects, recipes, and writing — all in one place.
          </p>
        </div>
        <div className="foot-col">
          <h4>Explore</h4>
          <Link to="/recipes">Recipes</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/blog">Blog</Link>
        </div>
        <div className="foot-col">
          <h4>Elsewhere</h4>
          <a
            href="https://github.com/Mattschoe"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/matthias-s-nielsen"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          <a href="mailto:matthias.s.nielsen@protonmail.com">Email</a>
        </div>
      </div>
      <div className="foot-bottom">
        <div className="container">
          <span>© 2026 Matt</span>
          <ThemeToggle variant="label" />
        </div>
      </div>
    </footer>
  );
}
