import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFile } from '../../hooks/useFile'
import { useSettingsStore } from '../../stores/settings'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_CONTENT = '# My Note\n\nSome content here\n'

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_CONTENT, sha: 'sha1' }),
    listDir: vi.fn().mockResolvedValue([
      { name: 'note.md', path: 'assistant/note.md', type: 'file' as const, sha: 'sha1' },
      { name: 'todo.md', path: 'assistant/todo.md', type: 'file' as const, sha: 'sha2' },
    ]),
    writeFile: vi.fn().mockResolvedValue('sha3'),
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
