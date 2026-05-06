import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInbox } from '../../hooks/useInbox'
import { useSettingsStore } from '../../stores/settings'
import type { GitHubClient } from '../../lib/github-client'

function makeMockClient(existing?: string): GitHubClient {
  return {
    readFile: existing
      ? vi.fn().mockResolvedValue({ content: existing, sha: 'sha1' })
      : vi.fn().mockRejectedValue({ status: 404 }),
    listDir: vi.fn().mockResolvedValue([]),
    writeFile: vi.fn().mockResolvedValue('sha2'),
  }
}

describe('useInbox', () => {
  beforeEach(() => {
    useSettingsStore.setState({ rootFolder: '' })
  })
  it('appends note to existing dated inbox file', async () => {
    const existing = '# 2025-01-15\n\n- First note\n'
    const client = makeMockClient(existing)
    const { result } = renderHook(() => useInbox(client))

    await act(async () => {
      await result.current.capture('Second note', '2025-01-15')
    })

    expect(client.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'inbox/2025-01-15.md',
        content: expect.stringContaining('Second note'),
        sha: 'sha1',
      })
    )
  })

  it('creates new inbox file when none exists for the date', async () => {
    const client = makeMockClient() // 404 on readFile
    const { result } = renderHook(() => useInbox(client))

    await act(async () => {
      await result.current.capture('Brand new note', '2025-01-16')
    })

    expect(client.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'inbox/2025-01-16.md',
        content: expect.stringContaining('Brand new note'),
        sha: '',
      })
    )
  })

  it('commit message includes date', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useInbox(client))

    await act(async () => {
      await result.current.capture('Note', '2025-03-01')
    })

    expect(client.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('2025-03-01'),
      })
    )
  })
})
