import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTodos } from '../../hooks/useTodos'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_TODO = `# Todo

## Cette semaine

- [ ] Buy groceries #urgent
- [x] Call dentist

## Ce mois-ci

- [ ] Book flight
`

function makeMockClient(overrides: Partial<GitHubClient> = {}): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_TODO, sha: 'sha1' }),
    listDir: vi.fn().mockResolvedValue([]),
    writeFile: vi.fn().mockResolvedValue('sha2'),
    createFile: vi.fn().mockResolvedValue('sha3'),
    ...overrides,
  }
}

describe('useTodos', () => {
  it('loads and parses todo.md from GitHub', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useTodos(client))

    await act(async () => {
      await result.current.load()
    })

    expect(result.current.sections).toHaveLength(2)
    expect(result.current.sections[0].title).toBe('Cette semaine')
    expect(result.current.sections[0].items).toHaveLength(2)
  })

  it('toggles a task and commits via writeFile', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useTodos(client))

    await act(async () => {
      await result.current.load()
    })

    const itemId = result.current.sections[0].items[0].id
    await act(async () => {
      await result.current.toggle(itemId)
    })

    expect(result.current.sections[0].items[0].checked).toBe(true)
    expect(client.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ sha: 'sha1' })
    )
  })

  it('adds a new task to a section and commits', async () => {
    const client = makeMockClient()
    const { result } = renderHook(() => useTodos(client))

    await act(async () => {
      await result.current.load()
    })

    await act(async () => {
      await result.current.addTask('Cette semaine', 'New important task #urgent')
    })

    const weekSection = result.current.sections.find((s) => s.title === 'Cette semaine')
    expect(weekSection?.items.some((i) => i.text === 'New important task')).toBe(true)
    expect(client.writeFile).toHaveBeenCalled()
  })
})
