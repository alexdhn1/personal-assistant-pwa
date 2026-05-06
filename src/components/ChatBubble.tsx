import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../stores/chat'

interface ChatBubbleProps {
  message: Message
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  if (message.role === 'tool') return null // tool results are shown via ToolCallIndicator

  return (
    <div
      className={[
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      <div
        className={[
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm',
          isAssistant ? 'prose dark:prose-invert prose-sm max-w-none' : '',
        ].join(' ')}
      >
        {isAssistant ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </div>
  )
}
