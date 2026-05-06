import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Todo from '../../pages/Todo'
import { useAuthStore } from '../../stores/auth'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_TODO = `# Todo

## Cette semaine

- [ ] Buy groceries #urgent
- [x] Call dentist
`

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_TODO, sha: 'sha1' }),
    listDir: vi.fn().mockResolvedValue([]),
    writeFile: vi.fn().mockResolvedValue('sha2'),
    createFile: vi.fn().mockResolvedValue('sha3'),
  }
}

function renderTodo(client: GitHubClient) {
  useAuthStore.setState({
    isAuthenticated: true,
    token: 'tok',
    client,
  })
  return render(
    <MemoryRouter>
      <Todo />
    </MemoryRouter>
  )
}

describe('Todo page', () => {
  it('renders section headings from todo.md', async () => {
    const client = makeMockClient()
    renderTodo(client)
    await waitFor(() => {
      expect(screen.getByText('Cette semaine')).toBeInTheDocument()
    })
  })

  it('renders task checkboxes', async () => {
    const client = makeMockClient()
    renderTodo(client)
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    })
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).not.toBeChecked()
    expect(checkboxes[1]).toBeChecked()
  })

  it('toggling a checkbox calls writeFile', async () => {
    const client = makeMockClient()
    renderTodo(client)
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    })
    const uncheckedBox = screen.getAllByRole('checkbox')[0]
    await userEvent.click(uncheckedBox)
    await waitFor(() => {
      expect(client.writeFile).toHaveBeenCalled()
    })
  })
})
