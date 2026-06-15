import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeUnwrapImages from 'rehype-unwrap-images';
import 'katex/dist/katex.min.css';

interface MarkdownProps {
  children: string;
  /** Extra classes alongside `.read` (the ported article-column styles). */
  className?: string;
  /**
   * Drop-cap the article's first paragraph (blog post template). Tags only the
   * first rendered `<p>` with the global `.dropcap` class, matching the
   * reference mechanism; later paragraphs render normally.
   */
  dropcap?: boolean;
}

// Renders an inline body image as a `<figure>`, reusing the global
// `.read figure`/`.read figcaption` styles. The Markdown title (the quoted text
// in `![alt](src "caption")`) becomes the caption — when omitted, no caption is
// shown. `rehype-unwrap-images` (below) strips the wrapping `<p>` first, so this
// `<figure>` is valid HTML and doesn't trip a hydration mismatch. `title` is not
// forwarded to the `<img>` so the browser doesn't also render it as a tooltip.
const imageComponent: Components['img'] = ({ src, alt, title }) => (
  <figure>
    <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" />
    {title ? <figcaption>{title}</figcaption> : null}
  </figure>
);

// Renders a Markdown body inside the `.read` article column so prose inherits
// the ported editorial styles (leads, blockquote rule, dropcap, lists). GFM is
// enabled for tables, strikethrough and task lists; remark-math + rehype-katex
// typeset inline `$...$` and block `$$...$$` math (KaTeX CSS imported above);
// inline images render as captioned figures (see `imageComponent`).
// Shared by every detail page and the Blog/Project/Recipe templates.
export function Markdown({ children, className, dropcap }: MarkdownProps) {
  const components: Components = { img: imageComponent };

  // When dropcap is on, tag only the first paragraph in render order with the
  // global `.dropcap` class (reusing `.dropcap::first-letter` from global.css).
  if (dropcap) {
    let firstParagraphSeen = false;
    components.p = ({ children, ...props }) => {
      const isFirst = !firstParagraphSeen;
      firstParagraphSeen = true;
      return (
        <p {...props} className={isFirst ? 'dropcap' : undefined}>
          {children}
        </p>
      );
    };
  }

  return (
    <div className={className ? `read ${className}` : 'read'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeUnwrapImages]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
