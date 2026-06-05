import { Link, useParams } from 'react-router-dom';
import { getPost } from '../content';
import { Markdown } from '../content/Markdown';
import { NotFound } from './NotFound';

// Minimal placeholder detail page (Phase 3): proves content-driven routing and
// renders the Markdown body. The full reading-column / dropcap template lands in
// Phase 5.
export function PostDetail() {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;
  if (!post) return <NotFound />;

  return (
    <article className="section">
      <div className="container">
        <p>
          <Link className="arrow-link" to="/blog">
            <span className="ar">&#8599;</span> Blog
          </Link>
        </p>
        <span className="kicker">Essay · {post.readingTime}</span>
        <h1>{post.title}</h1>
        <p className="lead">{post.excerpt}</p>
        <Markdown>{post.body}</Markdown>
        <p className="kicker">Full post template lands in Phase 5.</p>
      </div>
    </article>
  );
}
