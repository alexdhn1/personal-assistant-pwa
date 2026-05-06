import { describe, it, expect, vi } from 'vitest'
import { runAgentLoop } from '../../lib/agent-loop'
import type { LLMStreamEvent } from '../../lib/llm-client'
import type { AgentTools } from '../../lib/agent-tools'

// Helper: create a mock LLM client that emits given event sequences
function makeMockLLM(rounds: LLMStreamEvent[][]): { stream: ReturnType<typeof vi.fn> } {
  let callCount = 0
  const stream = vi.fn(async function* () {
    const events = rounds[callCount++ % rounds.length]
    for (const e of events) yield e
  })
  return { stream }
}

// Helper: mock agent tools
function makeMockTools(): AgentTools & {
  list_files: ReturnType<typeof vi.fn>
  read_file: ReturnType<typeof vi.fn>
  update_file: ReturnType<typeof vi.fn>
  create_file: ReturnType<typeof vi.fn>
} {
  return {
    list_files: vi.fn().mockResolvedValue([{ name: 'todo.md', type: 'file' }]),
    read_file: vi.fn().mockResolvedValue('# Todo\n- [ ] Task 1\n'),
    update_file: vi.fn().mockResolvedValue('✓ Updated todo.md (commit: abc123)'),
    create_file: vi.fn().mockResolvedValue('✓ Created ideas.md (commit: def456)'),
  }
}

describe('agent-loop: simple text response', () => {
  it('returns streamed text when LLM responds without tool calls', async () => {
    const llm = makeMockLLM([
      [
        { type: 'text_delta', text: 'Bonjour' },
        { type: 'text_delta', text: ' !' },
        { type: 'done', usage: { inputTokens: 5, outputTokens: 2 } },
      ],
    ])
    const tools = makeMockTools()

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'Bonjour' }], [])) {
      events.push(e)
    }

    const textEvents = events.filter((e) => e.type === 'text_delta')
    expect(textEvents.map((e) => e.text).join('')).toBe('Bonjour !')
    expect(events.at(-1)?.type).toBe('done')
  })
})

describe('agent-loop: tool call execution', () => {
  it('executes a tool call and sends result back to LLM', async () => {
    // Round 1: LLM requests read_file
    // Round 2: LLM generates text response after receiving tool result
    const llm = makeMockLLM([
      [
        { type: 'tool_call_start', toolCall: { id: 'tc1', name: 'read_file' } },
        { type: 'tool_call_delta', toolCall: { arguments: '{"path":"todo.md"}' } },
        { type: 'done' },
      ],
      [
        { type: 'text_delta', text: 'Je vois votre todo' },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 5 } },
      ],
    ])
    const tools = makeMockTools()

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'Lis mon todo' }], [])) {
      events.push(e)
    }

    expect(tools.read_file).toHaveBeenCalledWith({ path: 'todo.md' })
    const textEvents = events.filter((e) => e.type === 'text_delta')
    expect(textEvents.map((e) => e.text).join('')).toBe('Je vois votre todo')
  })

  it('emits tool_call_start and tool_result events for visibility', async () => {
    const llm = makeMockLLM([
      [
        { type: 'tool_call_start', toolCall: { id: 'tc1', name: 'list_files' } },
        { type: 'tool_call_delta', toolCall: { arguments: '{}' } },
        { type: 'done' },
      ],
      [{ type: 'text_delta', text: 'Done' }, { type: 'done' }],
    ])
    const tools = makeMockTools()

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'List files' }], [])) {
      events.push(e)
    }

    const toolStarts = events.filter((e) => e.type === 'tool_call_start')
    expect(toolStarts.length).toBeGreaterThan(0)
    expect(toolStarts[0].toolCall?.name).toBe('list_files')
  })
})

describe('agent-loop: safety cap', () => {
  it('stops after max 10 tool calls and returns error event', async () => {
    // LLM always requests a tool call — loop should stop at 10
    const infiniteToolCall: LLMStreamEvent[] = [
      { type: 'tool_call_start', toolCall: { id: 'tc1', name: 'list_files' } },
      { type: 'tool_call_delta', toolCall: { arguments: '{}' } },
      { type: 'done' },
    ]
    const llm = makeMockLLM(Array(11).fill(infiniteToolCall))
    const tools = makeMockTools()

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'loop' }], [])) {
      events.push(e)
    }

    expect(tools.list_files.mock.calls.length).toBeLessThanOrEqual(10)
    const errorEvents = events.filter((e) => e.type === 'error')
    expect(errorEvents.length).toBeGreaterThan(0)
  })
})

describe('agent-loop: error handling', () => {
  it('propagates LLM error events', async () => {
    const llm = makeMockLLM([[{ type: 'error', error: 'API key invalid' }]])
    const tools = makeMockTools()

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'hi' }], [])) {
      events.push(e)
    }

    expect(events.some((e) => e.type === 'error' && e.error === 'API key invalid')).toBe(true)
  })

  it('handles tool execution errors gracefully', async () => {
    const llm = makeMockLLM([
      [
        { type: 'tool_call_start', toolCall: { id: 'tc1', name: 'read_file' } },
        { type: 'tool_call_delta', toolCall: { arguments: '{"path":"missing.md"}' } },
        { type: 'done' },
      ],
      [{ type: 'text_delta', text: 'Fichier introuvable' }, { type: 'done' }],
    ])
    const tools = makeMockTools()
    tools.read_file.mockResolvedValue('File not found: missing.md')

    const events: LLMStreamEvent[] = []
    for await (const e of runAgentLoop(llm as never, tools, [{ role: 'user', content: 'lis missing' }], [])) {
      events.push(e)
    }

    // Should continue and get a text response from LLM after tool result
    const textEvents = events.filter((e) => e.type === 'text_delta')
    expect(textEvents.length).toBeGreaterThan(0)
  })
})
