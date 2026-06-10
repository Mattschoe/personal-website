import { Link, useParams } from 'react-router-dom';
import { getPost, formatDate } from '../content';
import { Markdown } from '../content/Markdown';
import { Image } from '../components/Image';
import { Seo } from '../seo/Seo';
import { articleJsonLd } from '../seo/meta';
import { NotFound } from './NotFound';
import styles from './PostDetail.module.css';

// Single post: left-aligned header (title, byline), centered lead figure (only
// when the post has a `hero`), then the 680px reading column with a drop-capped
// first paragraph. Per Matt, there is no reading-time, no "keep reading" 2-up,
// and no tag row — the post ends cleanly after its body.
export function PostDetail() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;
  if (!post) return <NotFound />;

  return (
    <div className="container">
      <Seo
        title={post.title}
        description={post.excerpt}
        image={post.hero}
        type="article"
        jsonLd={articleJsonLd(post)}
      />
      <nav className={styles.crumb}>
        <Link to="/blog">Blog</Link>
      </nav>

      <header className={styles.postHeader}>
        <h1>{post.title}</h1>
        <div className={styles.byline}>
          <span>{formatDate(post.date, { withYear: true })}</span>
        </div>
      </header>

      {post.hero && (
        <figure className={`${styles.leadFigure} read`}>
          <Image
            src={post.hero}
            alt={post.heroAlt ?? post.title}
            tone="beeswax"
            eager
          />
        </figure>
      )}

      <Markdown dropcap>{post.body}</Markdown>
    </div>
  );
}
