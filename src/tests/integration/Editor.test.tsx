import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuthStore } from '../../stores/auth'
import { useSettingsStore } from '../../stores/settings'
import Editor from '../../pages/Editor'
import type { GitHubClient } from '../../lib/github-client'

const SAMPLE_CONTENT = '# Hello World\n\nSome **bold** content here.\n\n- item 1\n- item 2\n'

function makeMockClient(): GitHubClient {
  return {
    readFile: vi.fn().mockResolvedValue({ content: SAMPLE_CONTENT, sha: 'sha1' }),
    listDir: vi.fn().mockImplementation((path: string) => {
      if (path === 'assistant') {
        return Promise.resolve([
          { name: 'todo.md', path: 'assistant/todo.md', type: 'file' as const, sha: 'sha1' },
          { name: 'areas', path: 'assistant/areas', type: 'dir' as const, sha: 'sha2' },
        ])
      }
      if (path === 'assistant/areas') {
        return Promise.resolve([
          { name: 'gifts.md', path: 'assistant/areas/gifts.md', type: 'file' as const, sha: 'sha3' },
        ])
      }
      return Promise.resolve([])
    }),
    writeFile: vi.fn().mockResolvedValue('sha-new'),
    createFile: vi.fn().mockResolvedValue('sha-new'),
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

function setup(client: GitHubClient) {
  useAuthStore.setState({ isAuthenticated: true, token: 'tok', client, sessionPassword: 'pass' })
  useSettingsStore.setState({ rootFolder: 'assistant' })
  return render(<Editor />)
}

// ─── US1: Browse files in nested directories ─────────────────────────────────

describe('Editor — US1: file tree', () => {
  it('renders root-level .md files in sidebar', async () => {
    setup(makeMockClient())
    await waitFor(() => {
      expect(screen.getByText('todo.md')).toBeInTheDocument()
    })
  })

  it('renders directories in sidebar', async () => {
    setup(makeMockClient())
    await waitFor(() => {
      expect(screen.getByText('areas')).toBeInTheDocument()
    })
  })

  it('shows nested files after expanding a directory', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('areas'))
    fireEvent.click(screen.getByText('areas'))
    await waitFor(() => {
      expect(screen.getByText('gifts.md')).toBeInTheDocument()
    })
  })

  it('collapses a directory on second click', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('areas'))
    fireEvent.click(screen.getByText('areas'))
    await waitFor(() => screen.getByText('gifts.md'))
    fireEvent.click(screen.getByText('areas'))
    await waitFor(() => {
      expect(screen.queryByText('gifts.md')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no files exist', async () => {
    const emptyClient: GitHubClient = {
      readFile: vi.fn(),
      listDir: vi.fn().mockResolvedValue([]),
      writeFile: vi.fn(),
      createFile: vi.fn(),
    }
    setup(emptyClient)
    await waitFor(() => {
      expect(screen.getByText(/aucun fichier/i)).toBeInTheDocument()
    })
  })
})

// ─── US2: View file content as rendered Markdown ─────────────────────────────

describe('Editor — US2: Markdown view', () => {
  it('shows placeholder when no file is selected', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    expect(screen.getByText(/sélectionnez un fichier/i)).toBeInTheDocument()
  })

  it('renders file content as Markdown after clicking a file', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument()
    })
  })

  it('does not show raw markdown syntax in read mode', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('heading', { name: /hello world/i }))
    expect(screen.queryByText('# Hello World')).not.toBeInTheDocument()
  })
})

// ─── US3: Breadcrumb navigation ──────────────────────────────────────────────

describe('Editor — US3: breadcrumb', () => {
  it('shows filename as breadcrumb for root-level file', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => {
      expect(screen.getByText('todo.md', { selector: '[data-testid="breadcrumb-last"]' })).toBeInTheDocument()
    })
  })

  it('shows folder and filename for nested file', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('areas'))
    fireEvent.click(screen.getByText('areas'))
    await waitFor(() => screen.getByText('gifts.md'))
    fireEvent.click(screen.getByText('gifts.md'))
    await waitFor(() => {
      expect(screen.getByText('areas', { selector: '[data-testid="breadcrumb-segment"]' })).toBeInTheDocument()
      expect(screen.getByText('gifts.md', { selector: '[data-testid="breadcrumb-last"]' })).toBeInTheDocument()
    })
  })
})

// ─── US4: Edit mode with save ────────────────────────────────────────────────

describe('Editor — US4: edit mode', () => {
  it('shows Modifier button in read mode', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('heading', { name: /hello world/i }))
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument()
  })

  it('switches to textarea with raw content on Modifier click', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('heading', { name: /hello world/i }))
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }))
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(SAMPLE_CONTENT)
  })

  it('shows Save and Annuler buttons in edit mode', async () => {
    setup(makeMockClient())
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('button', { name: /modifier/i }))
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }))
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument()
  })

  it('Annuler returns to Markdown view without saving', async () => {
    const client = makeMockClient()
    setup(client)
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('button', { name: /modifier/i }))
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }))
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /hello world/i })).toBeInTheDocument()
    })
    expect(client.writeFile).not.toHaveBeenCalled()
  })

  it('Save calls writeFile and returns to read mode', async () => {
    const client = makeMockClient()
    setup(client)
    await waitFor(() => screen.getByText('todo.md'))
    fireEvent.click(screen.getByText('todo.md'))
    await waitFor(() => screen.getByRole('button', { name: /modifier/i }))
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }))
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '# Updated\n' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(client.writeFile).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /updated/i })).toBeInTheDocument()
    })
  })
})

// ─── US5: Error and empty states ─────────────────────────────────────────────

describe('Editor — US5: error states', () => {
  it('shows error message when tree load fails', async () => {
    setup(makeErrorClient())
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows retry button on tree load error', async () => {
    setup(makeErrorClient())
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
    })
  })

  it('retries loading when retry button clicked', async () => {
    const client = makeErrorClient()
    setup(client)
    await waitFor(() => screen.getByRole('button', { name: /réessayer/i }))
    fireEvent.click(screen.getByRole('button', { name: /réessayer/i }))
    expect(client.listDir).toHaveBeenCalledTimes(2)
  })
})
