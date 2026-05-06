import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFile } from '../../hooks/useFile'
import { useSettingsStore } from '../../stores/settings'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_CONTENT = '# My Note\n\nSome content here\n'

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_CONTENT, sha: 'sha1' }),
    listDir: vi.fn().mockImplementation((path: string) => {
      if (path === 'assistant') {
        return Promise.resolve([
          { name: 'note.md', path: 'assistant/note.md', type: 'file' as const, sha: 'sha1' },
          { name: 'todo.md', path: 'assistant/todo.md', type: 'file' as const, sha: 'sha2' },
          { name: 'areas', path: 'assistant/areas', type: 'dir' as const, sha: 'sha3' },
          { name: 'image.png', path: 'assistant/image.png', type: 'file' as const, sha: 'sha4' },
        ])
      }
      if (path === 'assistant/areas') {
        return Promise.resolve([
          { name: 'gifts.md', path: 'assistant/areas/gifts.md', type: 'file' as const, sha: 'sha5' },
          { name: 'projects.md', path: 'assistant/areas/projects.md', type: 'file' as const, sha: 'sha6' },
        ])
      }
      return Promise.resolve([])
    }),
    writeFile: vi.fn().mockResolvedValue('sha3'),
    createFile: vi.fn().mockResolvedValue('sha4'),
  }
}

function makeEmptyDirClient(): GitHubClient {
  return {
    readFile: vi.fn(),
    listDir: vi.fn().mockImplementation((path: string) => {
      if (path === 'assistant') {
        return Promise.resolve([
          { name: 'emptydir', path: 'assistant/emptydir', type: 'dir' as const, sha: 'sha1' },
        ])
      }
      return Promise.resolve([])
    }),
    writeFile: vi.fn(),
    createFile: vi.fn(),
  }
}

function makeErrorClient(): GitHubClient {
  return {
    readFile: vi.fn(),
    listDir: vi.fn().mockRejectedValue(new Error('Network error')),
    writeFile: vi.fn(),
    createFile: vi.fn(),
  }
}

describe('useFile', () => {
  beforeEach(() => {
    useSettingsStore.setState({ rootFolder: 'assistant' })
  })

  it('loads file list for root folder', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadDir('assistant')
    })

    expect(result.current.files.length).toBeGreaterThan(0)
    expect(client.listDir).toHaveBeenCalledWith('assistant')
  })

  it('loads and exposes file content', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.openFile('assistant/note.md')
    })

    expect(result.current.content).toBe(SAMPLE_CONTENT)
    expect(result.current.currentPath).toBe('assistant/note.md')
  })

  it('saves modified content via writeFile and updates SHA', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.openFile('assistant/note.md')
    })

    await act(async () => {
      await result.current.save('# Updated\n\nNew content\n')
    })

    expect(client.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'assistant/note.md',
        content: '# Updated\n\nNew content\n',
        sha: 'sha1',
      })
    )
  })
})

describe('useFile — loadTree', () => {
  beforeEach(() => {
    useSettingsStore.setState({ rootFolder: 'assistant' })
  })

  it('builds a 2-level FileTreeNode array', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadTree('assistant')
    })

    const tree = result.current.tree
    // Root-level .md files
    expect(tree.some((n) => n.name === 'note.md' && n.type === 'file')).toBe(true)
    expect(tree.some((n) => n.name === 'todo.md' && n.type === 'file')).toBe(true)
    // Directory with children
    const areas = tree.find((n) => n.name === 'areas' && n.type === 'dir')
    expect(areas).toBeDefined()
    expect(areas?.children.some((c) => c.name === 'gifts.md')).toBe(true)
    expect(areas?.children.some((c) => c.name === 'projects.md')).toBe(true)
  })

  it('filters out non-.md files at root level', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadTree('assistant')
    })

    // image.png must not appear
    expect(result.current.tree.some((n) => n.name === 'image.png')).toBe(false)
  })

  it('excludes empty directories (no .md children)', async () => {
    const client = makeEmptyDirClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadTree('assistant')
    })

    // emptydir has no .md files → must be excluded
    expect(result.current.tree.some((n) => n.name === 'emptydir')).toBe(false)
    expect(result.current.tree.length).toBe(0)
  })

  it('sets treeError on listDir failure', async () => {
    const client = makeErrorClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadTree('assistant')
    })

    expect(result.current.treeError).toBe('Network error')
    expect(result.current.tree).toEqual([])
  })

  it('sets treeLoading to false after completion', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useFile(client))

    await act(async () => {
      await result.current.loadTree('assistant')
    })

    expect(result.current.treeLoading).toBe(false)
  })
})
