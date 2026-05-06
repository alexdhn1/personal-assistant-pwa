import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownViewProps {
  content: string
}

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto px-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
