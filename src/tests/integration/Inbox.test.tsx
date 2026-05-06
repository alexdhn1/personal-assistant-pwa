import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../stores/auth'
import Inbox from '../../pages/Inbox'
import type { GitHubClient } from '../../lib/github-client'

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockRejectedValue({ status: 404 }),
    listDir: vi.fn().mockResolvedValue([]),
    writeFile: vi.fn().mockResolvedValue('sha1'),
  }
}

describe('Inbox', () => {
  it('renders capture button / FAB', () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Inbox />)
    expect(screen.getByRole('button', { name: /capture|new|add|inbox/i })).toBeInTheDocument()
  })

  it('shows modal/form when FAB clicked', async () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Inbox />)
    const fab = screen.getByRole('button', { name: /capture|new|add|inbox/i })
    fireEvent.click(fab)
    expect(screen.getByPlaceholderText(/note|thought|capture/i)).toBeInTheDocument()
  })

  it('calls writeFile after submitting a note', async () => {
    const client = makeMockClient()
    useAuthStore.setState({ isAuthenticated: true, token: 'tok', client })
    render(<Inbox />)
    fireEvent.click(screen.getByRole('button', { name: /capture|new|add|inbox/i }))
    const textarea = screen.getByPlaceholderText(/note|thought|capture/i)
    fireEvent.change(textarea, { target: { value: 'My quick thought' } })
    fireEvent.click(screen.getByRole('button', { name: /save|submit|add|done/i }))
    await waitFor(() => {
      expect(client.writeFile).toHaveBeenCalled()
    })
  })
})
