import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Chat from '../../pages/Chat'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import { db } from '../../lib/storage'

// Mock useAgent so we don't call real LLM APIs
vi.mock('../../hooks/useAgent', () => ({
  useAgent: () => ({
    sendMessage: vi.fn(async function* () {
      yield { type: 'text_delta', text: 'Bonjour !' }
      yield { type: 'done' }
    }),
    isReady: true,
  }),
}))

// Mock useLLMKey so LLMSetup gate doesn't block
vi.mock('../../hooks/useLLMKey', () => ({
  useLLMKey: () => ({
    hasStoredKey: vi.fn().mockResolvedValue(true),
    saveKey: vi.fn(),
    loadKey: vi.fn().mockResolvedValue({ key: 'sk-test', provider: 'openai' }),
    deleteKey: vi.fn(),
  }),
}))

beforeEach(async () => {
  useAuthStore.setState({ isAuthenticated: true, token: 'ghp_test', client: null })
  useChatStore.getState().reset()
  await db.llmKeys.clear()
  await db.llmKeys.put({
    id: 'llm-api-key',
    encryptedKey: new ArrayBuffer(32),
    passwordSalt: new Uint8Array(16),
    encryptionIv: new Uint8Array(12),
    provider: 'openai',
  })
})

function renderChat() {
  return render(
    <MemoryRouter>
      <Chat />
    </MemoryRouter>
  )
}

describe('Chat page', () => {
  it('renders the chat input area', async () => {
    renderChat()
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /envoyer|send/i })).toBeInTheDocument()
    })
  })

  it('shows user message after sending', async () => {
    const user = userEvent.setup()
    renderChat()
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    const input = screen.getByRole('textbox')
    await user.type(input, 'Ajoute une tâche')
    await user.click(screen.getByRole('button', { name: /envoyer|send/i }))

    await waitFor(() => {
      expect(screen.getByText('Ajoute une tâche')).toBeInTheDocument()
    })
  })

  it('shows assistant response after sending', async () => {
    const user = userEvent.setup()
    renderChat()
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    const input = screen.getByRole('textbox')
    await user.type(input, 'Bonjour')
    await user.click(screen.getByRole('button', { name: /envoyer|send/i }))

    await waitFor(() => {
      expect(screen.getByText('Bonjour !')).toBeInTheDocument()
    })
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    renderChat()
    await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

    const input = screen.getByRole('textbox')
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /envoyer|send/i }))

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('shows "New conversation" button', async () => {
    renderChat()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nouvelle|new/i })).toBeInTheDocument()
    })
  })
})
