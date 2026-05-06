import type { TodoItem as TodoItemType } from '../lib/markdown-parser'

const TAG_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

interface Props {
  item: TodoItemType
  onToggle: (id: string) => void
}

export default function TodoItem({ item, onToggle }: Props) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => onToggle(item.id)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
      />
      <div className="flex flex-1 flex-wrap items-baseline gap-1.5 min-w-0">
        <span
          className={[
            'text-sm',
            item.checked
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white',
          ].join(' ')}
        >
          {item.text}
        </span>
        {item.tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${tagColor(tag)}`}
          >
            #{tag}
          </span>
        ))}
      </div>
    </label>
  )
}
