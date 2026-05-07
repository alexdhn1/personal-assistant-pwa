import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGitHub } from '../hooks/useGitHub'
import { useTodos } from '../hooks/useTodos'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import TodoItem from '../components/TodoItem'
import TaskInput from '../components/TaskInput'
import type { TodoSection } from '../lib/markdown-parser'

export default function Todo() {
  const navigate = useNavigate()
  const client = useGitHub()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const lastAgentWrite = useFilesStore((s) => s.lastAgentWrite)
  const { sections, loading, error, load, toggle, addTask, moveTask } = useTodos(client)
  const [moveMenu, setMoveMenu] = useState<{ itemId: string; from: string } | null>(null)

  useEffect(() => {
    if (!client) {
      navigate('/auth', { replace: true })
      return
    }
    load()
  }, [client])

  // Reload when agent writes a file (delay to let GitHub propagate)
  useEffect(() => {
    if (lastAgentWrite > 0) {
      const timer = setTimeout(() => load(), 5000)
      return () => clearTimeout(timer)
    }
  }, [lastAgentWrite])

  // Handle AuthError → force re-auth
  useEffect(() => {
    if (error?.includes('authentication') || error?.includes('401') || error?.includes('403')) {
      clearAuth()
      navigate('/auth', { replace: true })
    }
  }, [error])

  if (!client) return null

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-48">
        <div className="text-gray-400 text-sm animate-pulse">Loading todo.md…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={load}
          className="mt-2 text-sm text-violet-600 dark:text-violet-400 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Todo</h1>

      {sections.map((section: TodoSection) => (
        <section key={section.title}>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {section.title}
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {section.items.map((item) => (
              <div key={item.id} className="relative group">
                <TodoItem item={item} onToggle={toggle} />
                {/* Section move menu trigger */}
                <button
                  onClick={() =>
                    setMoveMenu(
                      moveMenu?.itemId === item.id ? null : { itemId: item.id, from: section.title }
                    )
                  }
                  aria-label="Move task"
                  className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 text-xs px-1"
                >
                  ⋮
                </button>

                {/* Move menu dropdown */}
                {moveMenu?.itemId === item.id && (
                  <div className="absolute right-0 top-7 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 min-w-32">
                    <p className="text-xs text-gray-400 px-2 py-1 border-b border-gray-100 dark:border-gray-700">
                      Move to…
                    </p>
                    {sections
                      .filter((s) => s.title !== section.title)
                      .map((target) => (
                        <button
                          key={target.title}
                          onClick={() => {
                            moveTask(item.id, section.title, target.title)
                            setMoveMenu(null)
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                        >
                          {target.title}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <TaskInput sectionTitle={section.title} onAdd={addTask} />
        </section>
      ))}

      {sections.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">
          No tasks found. Make sure assistant/todo.md exists.
        </p>
      )}
    </div>
  )
}

