import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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

// Renders a Markdown body inside the `.read` article column so prose inherits
// the ported editorial styles (leads, blockquote rule, dropcap, lists). GFM is
// enabled for tables, strikethrough and task lists; remark-math + rehype-katex
// typeset inline `$...$` and block `$$...$$` math (KaTeX CSS imported above).
// Shared by every detail page and the Blog/Project/Recipe templates.
export function Markdown({ children, className, dropcap }: MarkdownProps) {
  // When dropcap is on, tag only the first paragraph in render order with the
  // global `.dropcap` class (reusing `.dropcap::first-letter` from global.css).
  let components: Components | undefined;
  if (dropcap) {
    let firstParagraphSeen = false;
    components = {
      p({ children, ...props }) {
        const isFirst = !firstParagraphSeen;
        firstParagraphSeen = true;
        return (
          <p {...props} className={isFirst ? 'dropcap' : undefined}>
            {children}
          </p>
        );
      },
    };
  }

  return (
    <div className={className ? `read ${className}` : 'read'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
