import { Link } from 'react-router-dom';
import { getLatestFeed, formatDate, type FeedItem } from '../content';
import { Image } from '../components/Image';
import { Seo } from '../seo/Seo';
import styles from './Home.module.css';

// Real social URLs, matching Footer.tsx.
const GITHUB_URL = 'https://github.com/Mattschoe';
const LINKEDIN_URL = 'https://www.linkedin.com/in/matthias-s-nielsen';
const EMAIL = 'mailto:matthias.s.nielsen@protonmail.com';

// Per-stream presentation derived from the feed item's `type`: the tag label +
// class and the placeholder caption. Tone/href/date already live on the item.
const TYPE_META: Record<
  FeedItem['type'],
  { label: string; tagClass: string; phLabel: string }
> = {
  recipe: { label: 'Recipe', tagClass: 'tag--recipe', phLabel: 'Recipe photo · 4:3' },
  project: { label: 'Project', tagClass: 'tag--project', phLabel: 'Project shot · 4:3' },
  essay: { label: 'Essay', tagClass: 'tag--essay', phLabel: 'Essay image · 4:3' },
};

export function Home() {
  // Item 0 is the featured card; 1–3 fill the feed grid. Generated, never
  // hand-maintained (Rule 4).
  const feed = getLatestFeed(4);
  const featured = feed[0];
  const rest = feed.slice(1);

  return (
    // Layout already provides the <main> landmark, so this page is just its
    // sections — wrapping them in another <main> would nest landmarks.
    <>
      <Seo />

      {/* ============ HERO ============ */}
      <section className={`hero container ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <span className={styles.hi}>Hi! I&apos;m Matt</span>
            <h1>I build software, cook, and write.</h1>
            {/* TODO(copy): replace with Matt's real hero lead paragraph. */}
            <p className="lead">TODO: write hero lead copy.</p>
            <div className={styles.quick}>
              <Link className={styles.quickLink} to="/recipes">
                Recipes <span className="ar">&#8599;</span>
              </Link>
              <Link className={styles.quickLink} to="/projects">
                Projects <span className="ar">&#8599;</span>
              </Link>
              <Link className={styles.quickLink} to="/blog">
                Blog <span className="ar">&#8599;</span>
              </Link>
              <span className={styles.quickSep}></span>
              <a
                className="icon-btn"
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .5A11.5 11.5 0 0 0 8.4 22.9c.6.1.8-.2.8-.6v-2c-3.3.7-4-1.5-4-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
                </svg>
              </a>
              <a
                className="icon-btn"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9z" />
                </svg>
              </a>
            </div>
          </div>
          <div className={styles.heroPhoto}>
            <Image tone="sage" label="Portrait · square" glyph="M" alt="" eager />
          </div>
        </div>
      </section>

      {/* ============ LATEST (everything) ============ */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2>Latest</h2>
          </div>
        </div>

        {featured && (
          <Link
            className={`featured ${styles.featured}`}
            to={featured.href}
            aria-label={`Read featured ${TYPE_META[featured.type].label.toLowerCase()}`}
          >
            <Image
              src={featured.hero}
              alt={featured.heroAlt ?? featured.title}
              tone={featured.tone}
              label="Featured image · 16:10"
              glyph="✶"
              eager
            />
            <div className={styles.featuredBody}>
              <div className="card-top">
                <span className={`tag ${TYPE_META[featured.type].tagClass}`}>
                  {TYPE_META[featured.type].label}
                </span>
                <span className="card-meta">
                  {formatDate(featured.date, { withYear: true })}
                </span>
              </div>
              <h3>{featured.title}</h3>
              <p className="card-excerpt">{featured.excerpt}</p>
              <span
                className={`arrow-link ${styles.arrowOnly}`}
                aria-hidden="true"
              >
                <span className="ar">&#8599;</span>
              </span>
            </div>
          </Link>
        )}

        <div className={styles.feedGrid}>
          {rest.map((item) => {
            const meta = TYPE_META[item.type];
            return (
              <Link className="card" to={item.href} key={item.href}>
                <Image
                  src={item.hero}
                  alt={item.heroAlt ?? item.title}
                  tone={item.tone}
                  label={meta.phLabel}
                />
                <div className="card-top">
                  <span className={`tag ${meta.tagClass}`}>{meta.label}</span>
                  <span className="card-meta">{formatDate(item.date)}</span>
                </div>
                <div className="card-title">{item.title}</div>
                <p className="card-excerpt">{item.excerpt}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ ABOUT STRIP ============ */}
      <section className={`about-strip ${styles.aboutStrip}`} id="about">
        <div className={`container ${styles.aboutGrid}`}>
          <Image tone="latte" label="Portrait · 3:4" glyph="M" alt="" />
          <div className={styles.aboutText}>
            <h2>About me</h2>
            {/* TODO(copy): placeholder bio — replace the Lorem Ipsum below with
                Matt's real about copy. */}
            <p className="lead">
              TODO: write about-me copy. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation.
            </p>
            <p>
              Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
              irure dolor in reprehenderit in voluptate velit esse cillum dolore
              eu fugiat nulla pariatur.
            </p>
            <div className={`${styles.quick} ${styles.aboutActions}`}>
              <Link className="btn btn--accent" to="/projects">
                See my work <span>&#8599;</span>
              </Link>
              <a className="btn" href={EMAIL}>
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
