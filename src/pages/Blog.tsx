import { Link } from 'react-router-dom';
import { getPosts, formatDate } from '../content';
import { Seo } from '../seo/Seo';
import styles from './Blog.module.css';

// Blog index: editorial post rows (date · title + excerpt), whole row hovers.
// Rows are generated from getPosts() (pre-sorted newest-first) — drop a Markdown
// file in content/blog and it appears here on the next build (Rule 4). Per Matt,
// reading time is intentionally not shown.
export function Blog() {
  const posts = getPosts();

  return (
    <>
      <Seo
        title="Blog"
        description="Essays and notes on software, cooking, and whatever I'm thinking through."
      />
      <section className={`container ${styles.pageHead}`}>
        <h1>Blog</h1>
      </section>

      <section className="container">
        <div className={styles.postList}>
          {posts.map((post) => (
            <Link
              className={styles.postRow}
              to={`/blog/${post.slug}`}
              key={post.slug}
            >
              <span className={styles.postDate}>
                {formatDate(post.date, { withYear: true })}
              </span>
              <div className={styles.postMain}>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
