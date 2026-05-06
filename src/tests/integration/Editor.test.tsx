import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../stores/auth'
import Editor from '../../pages/Editor'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_CONTENT = '# Hello\n\nWorld\n'

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_CONTENT, sha: 'sha1' }),
    listDir: vi.fn().mockResolvedValue([
      { name: 'note.md', path: 'assistant/note.md', type: 'file' as const, sha: 'sha1' },
    ]),
    writeFile: vi.fn().mockResolvedValue('sha2'),
    createFile: vi.fn().mockResolvedValue('sha3'),
  }
}

describe('Editor', () => {
  it('renders file list', async () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Editor />)
    await waitFor(() => {
      expect(screen.getByText('note.md')).toBeInTheDocument()
    })
  })

  it('opens file and shows content in textarea', async () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Editor />)
    await waitFor(() => screen.getByText('note.md'))
    fireEvent.click(screen.getByText('note.md'))
    await waitFor(() => {
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(SAMPLE_CONTENT)
    })
  })

  it('saves file when save button clicked', async () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Editor />)
    await waitFor(() => screen.getByText('note.md'))
    fireEvent.click(screen.getByText('note.md'))
    await waitFor(() => screen.getByRole('textbox'))
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '# Changed\n' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(client.writeFile).toHaveBeenCalled()
    })
  })
})
