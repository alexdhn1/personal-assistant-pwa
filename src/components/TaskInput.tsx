import { useState, type KeyboardEvent } from 'react'

interface Props {
  sectionTitle: string
  onAdd: (sectionTitle: string, text: string) => Promise<void>
}

export default function TaskInput({ sectionTitle, onAdd }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onAdd(sectionTitle, trimmed)
      setValue('')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Add task to "${sectionTitle}"…`}
        disabled={loading}
        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
      />
      <button
        onClick={submit}
        disabled={loading || !value.trim()}
        aria-label="Add task"
        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors"
      >
        +
      </button>
    </div>
  )
}
