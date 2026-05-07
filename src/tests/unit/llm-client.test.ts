import { describe, it, expect } from 'vitest'
import type { LLMClient, LLMMessage, LLMStreamEvent, LLMToolDefinition } from '../../lib/llm-client'

// Helper: collect all events from an AsyncIterable
async function collectEvents(iter: AsyncIterable<LLMStreamEvent>): Promise<LLMStreamEvent[]> {
  const events: LLMStreamEvent[] = []
  for await (const e of iter) events.push(e)
  return events
}

// A simple mock LLM client that streams a fixed text
function makeMockClient(events: LLMStreamEvent[]): LLMClient {
  return {
    async *stream(_messages: LLMMessage[], _tools?: LLMToolDefinition[]) {
      void _messages
      void _tools
      for (const e of events) yield e
    },
  }
}

describe('LLMClient interface', () => {
  it('streams text_delta events and a done event', async () => {
    const client = makeMockClient([
      { type: 'text_delta', text: 'Hello' },
      { type: 'text_delta', text: ' world' },
      { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
    ])

    const events = await collectEvents(
      client.stream([{ role: 'user', content: 'Hi' }], [])
    )

    expect(events).toHaveLength(3)
    expect(events[0]).toEqual({ type: 'text_delta', text: 'Hello' })
    expect(events[2]).toEqual({ type: 'done', usage: { inputTokens: 10, outputTokens: 2 } })
  })

  it('emits tool_call_start and tool_call_delta events', async () => {
    const client = makeMockClient([
      { type: 'tool_call_start', toolCall: { id: 'tc1', name: 'read_file' } },
      { type: 'tool_call_delta', toolCall: { arguments: '{"path":"todo.md"}' } },
      { type: 'done' },
    ])

    const events = await collectEvents(
      client.stream([{ role: 'user', content: 'read my file' }], [])
    )

    expect(events[0].type).toBe('tool_call_start')
    expect(events[0].toolCall?.name).toBe('read_file')
    expect(events[1].type).toBe('tool_call_delta')
    expect(events[2].type).toBe('done')
  })

  it('emits error event on failure', async () => {
    const client = makeMockClient([
      { type: 'error', error: 'API key invalid' },
    ])

    const events = await collectEvents(
      client.stream([{ role: 'user', content: 'hi' }], [])
    )

    expect(events[0]).toEqual({ type: 'error', error: 'API key invalid' })
  })

  it('accepts tool result messages', async () => {
    const messages: LLMMessage[] = [
      { role: 'user', content: 'read my file' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [{ id: 'tc1', name: 'read_file', arguments: '{"path":"todo.md"}' }],
      },
      { role: 'tool', content: '# Todo\n- [ ] Task 1\n', tool_call_id: 'tc1' },
    ]

    const client = makeMockClient([
      { type: 'text_delta', text: 'I read your file' },
      { type: 'done' },
    ])

    const events = await collectEvents(client.stream(messages, []))
    expect(events).toHaveLength(2)
    expect(events[0].text).toBe('I read your file')
  })

  it('accepts tool definitions with JSON schema parameters', async () => {
    const tools: LLMToolDefinition[] = [
      {
        name: 'read_file',
        description: 'Read a file',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
      },
    ]

    const client = makeMockClient([{ type: 'done' }])
    const events = await collectEvents(
      client.stream([{ role: 'user', content: 'hi' }], tools)
    )
    expect(events[0].type).toBe('done')
  })
})
