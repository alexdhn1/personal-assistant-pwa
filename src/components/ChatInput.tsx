import { useState } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Écrivez votre message…"
        aria-label="Message"
        className={[
          'flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600',
          'px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500',
          'disabled:opacity-50',
          'max-h-32 overflow-y-auto',
        ].join(' ')}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Envoyer"
        className={[
          'shrink-0 rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-medium',
          'hover:bg-violet-700 disabled:opacity-40 transition-colors',
        ].join(' ')}
      >
        Envoyer
      </button>
    </form>
  )
}
