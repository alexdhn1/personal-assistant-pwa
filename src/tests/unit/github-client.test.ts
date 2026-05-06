import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGitHubClient, AuthError } from '../../lib/github-client'

const mockGetContent = vi.fn()
const mockCreateOrUpdateFileContents = vi.fn()

const mockOctokit = {
  rest: {
    repos: {
      getContent: mockGetContent,
      createOrUpdateFileContents: mockCreateOrUpdateFileContents,
    },
  },
}

function makeClient() {
  return createGitHubClient('token', 'owner', 'repo', 'main', mockOctokit)
}

describe('github-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads a file and returns decoded content + sha', async () => {
    const content = btoa('# Hello\n- [ ] Task 1\n')
    mockGetContent.mockResolvedValue({
      data: { type: 'file', content: content + '\n', sha: 'abc123' },
    })

    const result = await makeClient().readFile('assistant/todo.md')
    expect(result.content).toBe('# Hello\n- [ ] Task 1\n')
    expect(result.sha).toBe('abc123')
  })

  it('lists directory contents', async () => {
    mockGetContent.mockResolvedValue({
      data: [
        { type: 'file', name: 'todo.md', path: 'assistant/todo.md', sha: 'sha1' },
        { type: 'file', name: 'gifts.md', path: 'assistant/gifts.md', sha: 'sha2' },
      ],
    })

    const files = await makeClient().listDir('assistant/')
    expect(files).toHaveLength(2)
    expect(files[0].name).toBe('todo.md')
  })

  it('writes a file with correct SHA', async () => {
    mockCreateOrUpdateFileContents.mockResolvedValue({
      data: { content: { sha: 'newsha456' } },
    })

    const newSha = await makeClient().writeFile({
      path: 'assistant/todo.md',
      content: '# Updated\n',
      sha: 'abc123',
      message: 'update: todo.md - via PWA',
    })
    expect(newSha).toBe('newsha456')
    expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ sha: 'abc123' })
    )
  })

  it('throws AuthError on 401 response', async () => {
    mockGetContent.mockRejectedValue({ status: 401 })
    await expect(makeClient().readFile('assistant/todo.md')).rejects.toThrow(AuthError)
  })

  it('throws AuthError on 403 response', async () => {
    mockGetContent.mockRejectedValue({ status: 403 })
    await expect(makeClient().readFile('assistant/todo.md')).rejects.toThrow(AuthError)
  })
})
