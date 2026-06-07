import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div>
          <Link className="wordmark" to="/">
            Matt
          </Link>
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
    </footer>
  );
}
