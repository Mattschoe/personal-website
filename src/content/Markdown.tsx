import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  children: string;
  /** Extra classes alongside `.read` (the ported article-column styles). */
  className?: string;
}

// Renders a Markdown body inside the `.read` article column so prose inherits
// the ported editorial styles (leads, blockquote rule, dropcap, lists). GFM is
// enabled for tables, strikethrough and task lists. Shared by every detail page
// and the Blog/Project/Recipe templates in later phases.
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className ? `read ${className}` : 'read'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
