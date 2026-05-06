import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAgentTools } from '../../lib/agent-tools'

// Mock GitHub client
const mockReadFile = vi.fn()
const mockListDir = vi.fn()
const mockWriteFile = vi.fn()
const mockCreateFile = vi.fn()

const mockClient = {
  readFile: mockReadFile,
  listDir: mockListDir,
  writeFile: mockWriteFile,
  createFile: mockCreateFile,
}

function makeTools(rootFolder = 'assistant') {
  return createAgentTools(mockClient as never, rootFolder)
}

describe('agent-tools: list_files', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists files in the root folder', async () => {
    mockListDir.mockResolvedValue([
      { name: 'todo.md', path: 'assistant/todo.md', sha: 'sha1', type: 'file' },
      { name: 'inbox', path: 'assistant/inbox', sha: 'sha2', type: 'dir' },
    ])

    const tools = makeTools()
    const result = await tools.list_files({ path: '' })
    expect(result).toEqual([
      { name: 'todo.md', type: 'file' },
      { name: 'inbox', type: 'dir' },
    ])
    expect(mockListDir).toHaveBeenCalledWith('assistant')
  })

  it('lists files in a subfolder', async () => {
    mockListDir.mockResolvedValue([
      { name: '2026-05-06.md', path: 'assistant/inbox/2026-05-06.md', sha: 'sha3', type: 'file' },
    ])

    const tools = makeTools()
    const result = await tools.list_files({ path: 'inbox' })
    expect(result).toEqual([{ name: '2026-05-06.md', type: 'file' }])
    expect(mockListDir).toHaveBeenCalledWith('assistant/inbox')
  })

  it('handles "." as root path', async () => {
    mockListDir.mockResolvedValue([])
    const tools = makeTools()
    await tools.list_files({ path: '.' })
    expect(mockListDir).toHaveBeenCalledWith('assistant')
  })
})

describe('agent-tools: read_file', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads a file and returns its content', async () => {
    mockReadFile.mockResolvedValue({ content: '# Todo\n- [ ] Task 1\n', sha: 'sha1' })

    const tools = makeTools()
    const result = await tools.read_file({ path: 'todo.md' })
    expect(result).toBe('# Todo\n- [ ] Task 1\n')
    expect(mockReadFile).toHaveBeenCalledWith('assistant/todo.md')
  })

  it('returns error string when file not found', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }))

    const tools = makeTools()
    const result = await tools.read_file({ path: 'missing.md' })
    expect(result).toBe('File not found: missing.md')
  })

  it('rejects path traversal attacks', async () => {
    const tools = makeTools()
    const result = await tools.read_file({ path: '../secrets.md' })
    expect(result).toBe('Invalid path: must be within assistant/')
  })
})

describe('agent-tools: update_file', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates an existing file and returns confirmation', async () => {
    mockReadFile.mockResolvedValue({ content: '# Old content\n', sha: 'sha1' })
    mockWriteFile.mockResolvedValue('newsha456')

    const tools = makeTools()
    const result = await tools.update_file({
      path: 'todo.md',
      content: '# New content\n',
      message: 'update: todo.md - test',
    })
    expect(result).toMatch(/✓ Updated todo\.md \(commit: newsha456\)/)
    expect(mockWriteFile).toHaveBeenCalledWith({
      path: 'assistant/todo.md',
      content: '# New content\n',
      sha: 'sha1',
      message: 'update: todo.md - test',
    })
  })

  it('returns error when file not found', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }))

    const tools = makeTools()
    const result = await tools.update_file({ path: 'ghost.md', content: '# x\n' })
    expect(result).toBe('File not found: ghost.md. Use create_file instead.')
  })

  it('rejects path traversal', async () => {
    const tools = makeTools()
    const result = await tools.update_file({ path: '../etc/passwd', content: '' })
    expect(result).toBe('Invalid path: must be within assistant/')
  })

  it('uses default commit message when none provided', async () => {
    mockReadFile.mockResolvedValue({ content: '', sha: 'sha1' })
    mockWriteFile.mockResolvedValue('sha2')

    const tools = makeTools()
    await tools.update_file({ path: 'todo.md', content: '# x\n' })
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'update: todo.md - via AI assistant' })
    )
  })
})

describe('agent-tools: create_file', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new file and returns confirmation', async () => {
    mockCreateFile.mockResolvedValue('sha_new')

    const tools = makeTools()
    const result = await tools.create_file({
      path: 'ideas.md',
      content: '# Ideas\n',
      message: 'create: ideas.md',
    })
    expect(result).toMatch(/✓ Created ideas\.md \(commit: sha_new\)/)
    expect(mockCreateFile).toHaveBeenCalledWith({
      path: 'assistant/ideas.md',
      content: '# Ideas\n',
      message: 'create: ideas.md',
    })
  })

  it('returns error when file already exists (422)', async () => {
    mockCreateFile.mockRejectedValue(Object.assign(new Error('Unprocessable'), { status: 422 }))

    const tools = makeTools()
    const result = await tools.create_file({ path: 'todo.md', content: '# x\n' })
    expect(result).toBe('File already exists: todo.md. Use update_file instead.')
  })

  it('rejects path traversal', async () => {
    const tools = makeTools()
    const result = await tools.create_file({ path: '../evil.md', content: '' })
    expect(result).toBe('Invalid path: must be within assistant/')
  })

  it('uses default commit message when none provided', async () => {
    mockCreateFile.mockResolvedValue('sha_new')

    const tools = makeTools()
    await tools.create_file({ path: 'ideas.md', content: '# Ideas\n' })
    expect(mockCreateFile).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'create: ideas.md - via AI assistant' })
    )
  })
})
