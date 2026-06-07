import { Link, useParams } from 'react-router-dom';
import { getPost, formatDate } from '../content';
import { Markdown } from '../content/Markdown';
import { Image } from '../components/Image';
import { Seo } from '../seo/Seo';
import { articleJsonLd } from '../seo/meta';
import { NotFound } from './NotFound';
import styles from './PostDetail.module.css';

// Single post: left-aligned header (tag, title, byline), centered lead figure,
// then the 680px reading column with a drop-capped first paragraph and a tag
// row. Per Matt, there is no reading-time and no "keep reading" 2-up — the post
// ends cleanly after its tags. The lead figure stays a `.ph` placeholder until
// real imagery lands in Phase 8.
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
        <Link to="/blog">Blog</Link> <span>/</span> <span>Essay</span>
      </nav>

      <header className={styles.postHeader}>
        <span className="tag tag--essay">Essay</span>
        <h1>{post.title}</h1>
        <div className={styles.byline}>
          <span className="ph" data-tone="sage" data-ph=""></span>
          <span>{formatDate(post.date, { withYear: true })}</span>
        </div>
      </header>

      <figure className={`${styles.leadFigure} read`}>
        <Image
          src={post.hero}
          alt={post.heroAlt ?? post.title}
          tone="beeswax"
          label="Lead image · 16:8"
          eager
        />
      </figure>

      <Markdown dropcap>{post.body}</Markdown>

      <div className={styles.postFoot}>
        <div className={styles.tagRow}>
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
