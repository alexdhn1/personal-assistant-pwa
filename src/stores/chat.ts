import { create } from 'zustand'

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  timestamp: number
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  currentToolCalls: ToolCall[]
  tokenCount: { input: number; output: number }
  error: string | null

  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string
  updateLastAssistantContent: (text: string) => void
  setStreaming: (v: boolean) => void
  setError: (e: string | null) => void
  addTokens: (input: number, output: number) => void
  upsertToolCall: (tc: Partial<ToolCall> & { id: string }) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  currentToolCalls: [],
  tokenCount: { input: 0, output: 0 },
  error: null,

  addMessage(msg) {
    const id = crypto.randomUUID()
    set((s) => ({
      messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
    }))
    return id
  },

  updateLastAssistantContent(text) {
    set((s) => {
      const messages = [...s.messages]
      const last = messages.at(-1)
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + text }
      }
      return { messages }
    })
  },

  setStreaming(v) {
    set({ isStreaming: v })
  },

  setError(e) {
    set({ error: e })
  },

  addTokens(input, output) {
    set((s) => ({
      tokenCount: {
        input: s.tokenCount.input + input,
        output: s.tokenCount.output + output,
      },
    }))
  },

  upsertToolCall(tc) {
    set((s) => {
      const existing = s.currentToolCalls.find((t) => t.id === tc.id)
      if (existing) {
        return {
          currentToolCalls: s.currentToolCalls.map((t) =>
            t.id === tc.id ? { ...t, ...tc } : t
          ),
        }
      }
      return {
        currentToolCalls: [
          ...s.currentToolCalls,
          {
            id: tc.id,
            name: tc.name ?? '',
            arguments: tc.arguments ?? {},
            status: tc.status ?? 'pending',
          },
        ],
      }
    })
  },

  reset() {
    set({
      messages: [],
      isStreaming: false,
      currentToolCalls: [],
      tokenCount: { input: 0, output: 0 },
      error: null,
    })
  },
}))
