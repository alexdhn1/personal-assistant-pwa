import { useState, useCallback } from 'react'
import type { GitHubClient } from '../lib/github-client'
import { parseTodoFile, serializeTodoFile, type TodoSection } from '../lib/markdown-parser'
import { useSettingsStore } from '../stores/settings'

const TODO_PATH = 'assistant/todo.md'

export function useTodos(client: GitHubClient) {
  const { rootFolder } = useSettingsStore.getState()
  const todoPath = rootFolder ? `${rootFolder}/todo.md` : TODO_PATH

  const [sections, setSections] = useState<TodoSection[]>([])
  const [sha, setSha] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const file = await client.readFile(todoPath)
      setSha(file.sha)
      setSections(parseTodoFile(file.content))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [client, todoPath])

  const commit = useCallback(
    async (updated: TodoSection[], message: string) => {
      const content = serializeTodoFile(updated)
      const newSha = await client.writeFile({
        path: todoPath,
        content,
        sha,
        message,
      })
      setSha(newSha)
      setSections(updated)
    },
    [client, todoPath, sha]
  )

  const toggle = useCallback(
    async (itemId: string) => {
      const updated = sections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      }))
      await commit(updated, `update: todo.md - via PWA`)
    },
    [sections, commit]
  )

  const addTask = useCallback(
    async (sectionTitle: string, rawText: string) => {
      const tags: string[] = []
      const text = rawText
        .replace(/#([\w-]+)/g, (_, t) => {
          tags.push(t)
          return ''
        })
        .trim()

      const newItem = {
        id: `item-${Date.now()}`,
        text,
        checked: false,
        tags,
      }

      const updated = sections.map((section) =>
        section.title === sectionTitle
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
      await commit(updated, `add: ${text} - via PWA`)
    },
    [sections, commit]
  )

  const moveTask = useCallback(
    async (itemId: string, fromSection: string, toSection: string) => {
      let movedItem = null as (typeof sections)[0]['items'][0] | null
      const updated = sections.map((section) => {
        if (section.title === fromSection) {
          const item = section.items.find((i) => i.id === itemId)
          if (item) movedItem = item
          return { ...section, items: section.items.filter((i) => i.id !== itemId) }
        }
        return section
      })
      if (!movedItem) return
      const finalUpdated = updated.map((section) =>
        section.title === toSection
          ? { ...section, items: [...section.items, movedItem!] }
          : section
      )
      await commit(finalUpdated, `move: ${movedItem.text} - via PWA`)
    },
    [sections, commit]
  )

  return { sections, loading, error, load, toggle, addTask, moveTask }
}
