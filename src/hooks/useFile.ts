import { useState, useCallback } from 'react'
import type { GitHubClient, FileEntry } from '../lib/github-client'

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children: FileTreeNode[]
}

export function useFile(client: GitHubClient) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [content, setContent] = useState<string>('')
  const [currentPath, setCurrentPath] = useState<string>('')
  const [sha, setSha] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tree, setTree] = useState<FileTreeNode[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError, setTreeError] = useState<string | null>(null)

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

  const loadTree = useCallback(
    async (rootFolder: string) => {
      setTreeLoading(true)
      setTreeError(null)
      try {
        const root = rootFolder.replace(/\/+$/, '')
        const topLevel = await client.listDir(root)
        const nodes: FileTreeNode[] = []

        for (const entry of topLevel) {
          if (entry.type === 'file') {
            if (!entry.name.endsWith('.md')) continue
            nodes.push({ name: entry.name, path: entry.path, type: 'file', children: [] })
          } else if (entry.type === 'dir') {
            let children: FileTreeNode[] = []
            try {
              const subEntries = await client.listDir(entry.path)
              children = subEntries
                .filter((s) => s.type === 'file' && s.name.endsWith('.md'))
                .map((s) => ({ name: s.name, path: s.path, type: 'file' as const, children: [] }))
            } catch {
              // skip unlistable dirs
            }
            if (children.length > 0) {
              nodes.push({ name: entry.name, path: entry.path, type: 'dir', children })
            }
          }
        }

        setTree(nodes)
      } catch (err) {
        setTreeError(err instanceof Error ? err.message : 'Failed to load file tree')
        setTree([])
      } finally {
        setTreeLoading(false)
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

  return { files, content, currentPath, loading, error, loadDir, openFile, save, tree, treeLoading, treeError, loadTree }
}
