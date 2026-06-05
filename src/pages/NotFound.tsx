import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <span className="kicker">404</span>
        <h1>Page not found</h1>
        <p className="lead">
          That page doesn&apos;t exist (or hasn&apos;t been written yet).
        </p>
        <p>
          <Link className="arrow-link" to="/">
            Back home <span className="ar">&#8599;</span>
          </Link>
        </p>
      </div>
    </section>
  );
}
