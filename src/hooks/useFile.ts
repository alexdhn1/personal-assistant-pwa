import { useState, useCallback } from 'react'
import type { GitHubClient, FileEntry } from '../lib/github-client'

export function useFile(client: GitHubClient) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [content, setContent] = useState<string>('')
  const [currentPath, setCurrentPath] = useState<string>('')
  const [sha, setSha] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDir = useCallback(
    async (path: string) => {
      setLoading(true)
      setError(null)
      try {
        const entries = await client.listDir(path)
        setFiles(entries)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to list directory')
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  const openFile = useCallback(
    async (path: string) => {
      setLoading(true)
      setError(null)
      try {
        const file = await client.readFile(path)
        setContent(file.content)
        setSha(file.sha)
        setCurrentPath(path)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open file')
      } finally {
        setLoading(false)
      }
    },
    [client]
  )

  const save = useCallback(
    async (newContent: string) => {
      if (!currentPath) return
      setLoading(true)
      setError(null)
      try {
        const newSha = await client.writeFile({
          path: currentPath,
          content: newContent,
          sha,
          message: `edit: ${currentPath} - via PWA`,
        })
        setSha(newSha)
        setContent(newContent)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [client, currentPath, sha]
  )

  return { files, content, currentPath, loading, error, loadDir, openFile, save }
}
