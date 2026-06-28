import { Link } from 'react-router-dom';
import { getLatestFeed, formatDate, type FeedItem } from '../content';
import { Image } from '../components/Image';
import { PrefetchLink } from '../components/PrefetchLink';
import { RecipeRatingBadge } from '../components/RecipeRatingBadge';
import { useAllRatings } from '../components/useAllRatings';
import { HeroCircle } from '../components/HeroCircle';
import { WhatImUpTo } from '../components/WhatImUpTo';
import { Seo } from '../seo/Seo';
import styles from './Home.module.css';

// Real social URLs, matching Footer.tsx.
const GITHUB_URL = 'https://github.com/Mattschoe';
const LINKEDIN_URL = 'https://www.linkedin.com/in/matthias-s-nielsen';
const EMAIL = 'mailto:matthias.s.nielsen@protonmail.com';

// Per-stream presentation derived from the feed item's `type`: the tag label +
// class. Tone/href/date already live on the item.
const TYPE_META: Record<FeedItem['type'], { label: string; tagClass: string }> = {
  recipe: { label: 'Recipe', tagClass: 'tag--recipe' },
  project: { label: 'Project', tagClass: 'tag--project' },
  essay: { label: 'Essay', tagClass: 'tag--essay' },
};

// Ratings only exist for recipes. FeedItem carries no slug, but recipe hrefs are
// `/recipes/<slug>` — pull the slug back off for the rating lookup.
function recipeSlug(item: FeedItem): string | undefined {
  return item.type === 'recipe' ? item.href.split('/').pop() : undefined;
}

export function Home() {
  // Item 0 is the featured card; 1–3 fill the feed grid. Generated, never
  // hand-maintained (Rule 4).
  const feed = getLatestFeed(4);
  const featured = feed[0];
  const rest = feed.slice(1);
  const ratings = useAllRatings();

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
            <p className="lead">
              I'm a software developer studying at the IT-University of Copenhagen. This place is
              where i keep my projects and writing, but most important of all, my beloved recipes.
            </p>
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
            <HeroCircle />
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
          <PrefetchLink
            className={`featured ${styles.featured} ${featured.hero ? '' : styles.featuredNoImage}`}
            to={featured.href}
            prefetch={featured.hero}
            aria-label={`Read featured ${TYPE_META[featured.type].label.toLowerCase()}`}
          >
            {featured.hero && (
              <Image
                src={featured.hero}
                alt={featured.heroAlt ?? featured.title}
                tone={featured.tone}
                eager
              />
            )}
            <div className={styles.featuredBody}>
              <div className="card-top">
                <span className={`tag ${TYPE_META[featured.type].tagClass}`}>
                  {TYPE_META[featured.type].label}
                </span>
                <span className="card-meta">{formatDate(featured.date, { withYear: true })}</span>
              </div>
              <h3>{featured.title}</h3>
              {featured.caption && <p className="card-excerpt">{featured.caption}</p>}
              {recipeSlug(featured) && (
                <RecipeRatingBadge
                  slug={recipeSlug(featured)!}
                  rating={ratings[recipeSlug(featured)!]}
                  pinned={false}
                />
              )}
              <span className={`arrow-link ${styles.arrowOnly}`} aria-hidden="true">
                <span className="ar">&#8599;</span>
              </span>
            </div>
          </PrefetchLink>
        )}

        <div className={styles.feedGrid}>
          {rest.map((item) => {
            const meta = TYPE_META[item.type];
            return (
              <PrefetchLink className="card" to={item.href} prefetch={item.hero} key={item.href}>
                {item.hero && (
                  <Image src={item.hero} alt={item.heroAlt ?? item.title} tone={item.tone} />
                )}
                <div className="card-top">
                  <span className={`tag ${meta.tagClass}`}>{meta.label}</span>
                  <span className="card-meta">{formatDate(item.date)}</span>
                </div>
                <div className="card-title">{item.title}</div>
                {item.caption && <p className="card-excerpt">{item.caption}</p>}
                {recipeSlug(item) && (
                  <RecipeRatingBadge slug={recipeSlug(item)!} rating={ratings[recipeSlug(item)!]} />
                )}
              </PrefetchLink>
            );
          })}
        </div>
      </section>

      {/* ============ WHAT I'M UP TO ============ */}
      <WhatImUpTo />

      {/* ============ ABOUT ============ */}
      <section className={`section container ${styles.about}`} id="about">
        <div className="section-head">
          <div>
            <h2>About me</h2>
          </div>
        </div>

        <div className={styles.aboutGrid}>
          <Image src={"/images/about_me_image.webp"} label="Portrait · 3:4" alt="A fun little picture of me mid crossaint eating" />
          <div className={styles.aboutText}>
            <p className="lead">Hi! My name is Matt!</p>
            <p>
              I'm a student at the IT-University of Copenhagen, where i am currently taking my
              Bachelor in Software Development. While i am a huge fan of coding, what i love much
              more is building useful products and tools for the people i love and care for. For me
              software development has always been the most creative field and i love showing that
              creativity in everything i build. Oh, and i also love cooking, so while this website
              was originally for showing off my work, it has mostly been transformed to a recipe
              site. Enjoy!
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
